
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ChatMessage } from '@/types/chat';
import { useUserData } from './useUserData';

/**
 * Hook for managing active DM messages that syncs with global message state
 * and handles real-time updates via events
 */
export const useActiveDMMessages = (
  conversationId: string,
  otherUserId: string,
  currentUserId: string | undefined
) => {
  // Local state for messages in this conversation
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const { userCache, fetchUserData } = useUserData();
  const processedMsgIds = useRef(new Set<string>()).current;
  
  // Fetch other user's data if needed
  useEffect(() => {
    if (otherUserId && !userCache[otherUserId] && currentUserId) {
      fetchUserData(otherUserId);
    }
  }, [otherUserId, userCache, fetchUserData, currentUserId]);

  // Listen for DM message events with optimized handler
  useEffect(() => {
    const handleDMMessageReceived = (e: CustomEvent) => {
      if (e.detail.conversationId === conversationId && e.detail.message) {
        const newMessage = e.detail.message;
        
        // Skip if we've already processed this message
        if (processedMsgIds.has(newMessage.id)) return;
        
        setMessages(prev => {
          // Additional check to prevent duplicates
          if (prev.some(msg => msg.id === newMessage.id)) return prev;
          
          // Add to processed set
          processedMsgIds.add(newMessage.id);
          
          // Add the new message and sort by timestamp
          return [...prev, newMessage].sort(
            (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
          );
        });
      }
    };

    const handleDMMessageDeleted = (e: CustomEvent) => {
      if (e.detail.conversationId === conversationId) {
        const msgId = e.detail.messageId;
        
        // Also remove from processed set
        if (processedMsgIds.has(msgId)) {
          processedMsgIds.delete(msgId);
        }
        
        setMessages(prev => 
          prev.filter(msg => msg.id !== msgId)
        );
      }
    };

    // Add event listeners
    window.addEventListener('dmMessageReceived', handleDMMessageReceived as EventListener);
    window.addEventListener('dmMessageDeleted', handleDMMessageDeleted as EventListener);

    return () => {
      window.removeEventListener('dmMessageReceived', handleDMMessageReceived as EventListener);
      window.removeEventListener('dmMessageDeleted', handleDMMessageDeleted as EventListener);
    };
  }, [conversationId, processedMsgIds]);

  // Whenever conversation changes, clear processed message IDs
  useEffect(() => {
    return () => {
      // Clear the processed message set when unmounting or when conversation changes
      processedMsgIds.clear();
    };
  }, [conversationId, processedMsgIds]);

  // Load initial messages for the conversation - use memo to prevent unnecessary refetches
  const fetchMessages = useCallback(async () => {
    // Skip for new conversations
    if (!conversationId || conversationId === 'new' || !currentUserId) {
      return;
    }

    try {
      const { data } = await supabase
        .from('direct_messages')
        .select(`
          id, 
          text, 
          sender_id, 
          receiver_id,
          conversation_id,
          timestamp
        `)
        .eq('conversation_id', conversationId)
        .order('timestamp', { ascending: true })
        .limit(50);

      if (data && data.length > 0) {
        // Transform database records to ChatMessage format
        const formattedMessages: ChatMessage[] = data.map(msg => {
          const isCurrentUser = msg.sender_id === currentUserId;
          const user = isCurrentUser ? null : userCache[msg.sender_id];
          
          // Add to processed set to prevent duplicates
          processedMsgIds.add(msg.id);
          
          return {
            id: msg.id,
            text: msg.text,
            sender: {
              id: msg.sender_id,
              name: isCurrentUser ? 'You' : user?.name || 'User',
              avatar: isCurrentUser ? undefined : user?.avatar || '/placeholder.svg'
            },
            timestamp: msg.timestamp
          };
        });
        
        setMessages(formattedMessages);
      }
    } catch (error) {
      console.error('[useActiveDMMessages] Error fetching DM messages:', error);
    }
  }, [conversationId, currentUserId, userCache, processedMsgIds]);
  
  // Only fetch messages when the conversation changes
  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  // Add a new message optimistically (for local UI updates)
  const addOptimisticMessage = useCallback((message: ChatMessage) => {
    setMessages(prev => {
      // Skip if already processed
      if (processedMsgIds.has(message.id)) return prev;
      
      // Add to processed set
      processedMsgIds.add(message.id);
      
      return [...prev, {
        ...message,
        optimistic: true // Mark as optimistic
      }];
    });
  }, [processedMsgIds]);

  return { 
    messages, 
    setMessages,
    addOptimisticMessage
  };
};
