
import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ChatMessage } from '@/types/chat';
import { toast } from '@/hooks/use-toast';
import { useUserData } from './useUserData';

export const useDMSubscription = (
  conversationId: string | undefined,
  otherUserId: string | undefined,
  currentUserId: string | undefined,
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>
) => {
  const subscriptionError = useRef(false);
  const isMounted = useRef(true);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const processedMessages = useRef<Set<string>>(new Set());
  const { userCache, fetchUserData } = useUserData();
  
  // Clean up function
  const cleanupSubscription = useCallback(() => {
    if (channelRef.current) {
      console.log(`[useDMSubscription] Cleaning up subscription for conversation ${conversationId}`);
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }
  }, [conversationId]);

  // Clean up resources on unmount
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
      cleanupSubscription();
      // Clear processed messages cache on unmount
      processedMessages.current.clear();
    };
  }, [cleanupSubscription]);

  // Fetch other user's data if needed
  useEffect(() => {
    if (otherUserId && !userCache[otherUserId]) {
      fetchUserData(otherUserId);
    }
  }, [otherUserId, userCache, fetchUserData]);

  // Clear processed message cache when conversation changes
  useEffect(() => {
    processedMessages.current.clear();
  }, [conversationId]);

  // Setup subscription when conversation details are ready
  useEffect(() => {
    // Clean up any existing subscription
    cleanupSubscription();
    
    // Guard clause: early return if not ready
    if (!conversationId || !currentUserId || !otherUserId || conversationId === 'new') {
      return;
    }
    
    try {
      console.log(`[useDMSubscription] Setting up subscription for conversation ${conversationId}`);
      
      // Store the current conversation ID in a stable reference
      const stableConversationId = conversationId;
      
      const channel = supabase
        .channel(`direct_messages:${stableConversationId}`)
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'direct_messages',
          filter: `conversation_id=eq.${stableConversationId}`
        }, async (payload) => {
          if (!isMounted.current) return;
          
          console.log('[useDMSubscription] New direct message received:', payload);
          
          const newMessage = payload.new;
          
          // Skip processing if we've seen this message before
          const messageId = newMessage.id?.toString();
          if (!messageId || processedMessages.current.has(messageId)) {
            console.log('[useDMSubscription] Skipping duplicate message:', messageId);
            return;
          }
          
          // Mark as processed
          processedMessages.current.add(messageId);
          
          // Ensure we have the user data for proper display
          if (newMessage.sender_id !== currentUserId && !userCache[newMessage.sender_id]) {
            await fetchUserData(newMessage.sender_id);
          }
          
          const user = userCache[otherUserId];
          
          // Format the message for the UI
          const chatMessage: ChatMessage = {
            id: newMessage.id,
            text: newMessage.text,
            sender: {
              id: newMessage.sender_id,
              name: newMessage.sender_id === currentUserId ? 'You' : user?.name || 'User',
              avatar: newMessage.sender_id === currentUserId ? undefined : user?.avatar || '/placeholder.svg'
            },
            timestamp: newMessage.timestamp
          };
          
          // Dispatch a custom event with the stable conversation ID
          window.dispatchEvent(new CustomEvent('dmMessageReceived', { 
            detail: { 
              conversationId: stableConversationId, 
              message: chatMessage 
            } 
          }));
        })
        .subscribe((status) => {
          console.log(`DM subscription status for ${stableConversationId}:`, status);
        });
      
      channelRef.current = channel;
      subscriptionError.current = false;
      
    } catch (error) {
      console.error('[useDMSubscription] Error setting up subscription:', error);
      
      if (!subscriptionError.current && isMounted.current) {
        toast({
          title: "Connection Error",
          description: "Could not set up real-time updates for messages.",
          variant: "destructive"
        });
        subscriptionError.current = true;
      }
    }
    
    return cleanupSubscription;
  }, [conversationId, currentUserId, otherUserId, userCache, cleanupSubscription, fetchUserData]);
};
