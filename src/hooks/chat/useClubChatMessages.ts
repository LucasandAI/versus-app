
import { useState, useCallback, useEffect } from 'react';
import { ChatMessage } from '@/types/chat';
import { supabase } from '@/integrations/supabase/client';
import { usePaginatedMessages } from './usePaginatedMessages';
import { useMessageDeduplication } from './useMessageDeduplication';
import { useRealtimeSubscriptions } from './useRealtimeSubscriptions';
import { useVirtualizedScroll } from './useVirtualizedScroll';

export const useClubChatMessages = (clubId: string | undefined) => {
  const [optimisticMessages, setOptimisticMessages] = useState<ChatMessage[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Use our pagination hook
  const {
    messages: paginatedMessages,
    isLoading,
    hasMore,
    loadMoreMessages
  } = usePaginatedMessages(clubId || '', 'club');
  
  // Combine paginated messages with optimistic ones
  const allMessages = [...paginatedMessages, ...optimisticMessages];
  
  // Use our message deduplication hook
  const {
    addMessagesWithoutDuplicates,
    clearMessageIds
  } = useMessageDeduplication();
  
  // Handle new messages from real-time subscriptions
  const handleNewMessage = useCallback((message: ChatMessage) => {
    // Remove any matching optimistic message first
    setOptimisticMessages(prev => prev.filter(m => 
      m.text !== message.text || 
      m.sender.id !== message.sender.id ||
      Math.abs(new Date(m.timestamp).getTime() - new Date(message.timestamp).getTime()) > 10000
    ));
    
    // We don't add the message here as it will be added in the next fetch
  }, []);
  
  // Handle message deletions
  const handleMessageDeleted = useCallback((messageId: string) => {
    setOptimisticMessages(prev => prev.filter(m => m.id !== messageId));
  }, []);
  
  // Set up real-time subscriptions
  useRealtimeSubscriptions(clubId || '', 'club', {
    onNewMessage: handleNewMessage,
    onMessageDeleted: handleMessageDeleted,
    enabled: !!clubId && clubId !== 'new'
  });
  
  // Reset state when club changes
  useEffect(() => {
    setOptimisticMessages([]);
    clearMessageIds();
  }, [clubId, clearMessageIds]);
  
  // Optimized scroll handling
  const {
    scrollRef,
    lastMessageRef,
    scrollToBottom,
    atBottom
  } = useVirtualizedScroll(allMessages, loadMoreMessages, isLoading);
  
  // Send a new message
  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || !clubId) return false;
    
    setIsSubmitting(true);
    
    // Create optimistic message
    const optimisticId = `temp-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const timestamp = new Date().toISOString();
    
    try {
      // Get current user from auth
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) throw new Error('User not authenticated');
      
      // Get user profile data
      const { data: userData } = await supabase
        .from('users')
        .select('name, avatar')
        .eq('id', user.id)
        .single();
      
      const optimisticMessage: ChatMessage = {
        id: optimisticId,
        text,
        sender: {
          id: user.id,
          name: userData?.name || 'You',
          avatar: userData?.avatar
        },
        timestamp,
        optimistic: true
      };
      
      // Add optimistic message to state
      setOptimisticMessages(prev => [...prev, optimisticMessage]);
      
      // Scroll to bottom to show the new message
      setTimeout(() => scrollToBottom(true), 50);
      
      // Send the actual message
      const { error } = await supabase
        .from('club_chat_messages')
        .insert({
          message: text,
          club_id: clubId,
          sender_id: user.id
        });
      
      if (error) throw error;
      
      return true;
    } catch (error) {
      console.error('[useClubChatMessages] Error sending message:', error);
      
      // Remove optimistic message on error
      setOptimisticMessages(prev => prev.filter(m => m.id !== optimisticId));
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }, [clubId, scrollToBottom]);
  
  // Delete a message
  const deleteMessage = useCallback(async (messageId: string) => {
    if (!messageId) return false;
    
    try {
      // Remove message from local state first for optimistic UI update
      setOptimisticMessages(prev => prev.filter(m => m.id !== messageId));
      
      // Skip deletion for optimistic messages
      if (messageId.startsWith('temp-')) {
        return true;
      }
      
      // Delete the message from database
      const { error } = await supabase
        .from('club_chat_messages')
        .delete()
        .eq('id', messageId);
      
      if (error) throw error;
      
      return true;
    } catch (error) {
      console.error('[useClubChatMessages] Error deleting message:', error);
      return false;
    }
  }, []);
  
  return {
    messages: allMessages,
    isLoading,
    hasMore,
    loadMore: loadMoreMessages,
    scrollRef,
    lastMessageRef,
    sendMessage,
    deleteMessage,
    isSubmitting,
    atBottom,
    scrollToBottom
  };
};
