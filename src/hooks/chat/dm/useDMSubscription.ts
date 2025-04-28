
import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ChatMessage } from '@/types/chat';
import { toast } from '@/hooks/use-toast';
import debounce from 'lodash/debounce';
import { useApp } from '@/context/AppContext';

export const useDMSubscription = (
  conversationId: string | undefined,
  otherUserId: string | undefined,
  currentUserId: string | undefined,
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>,
  addMessage: (message: ChatMessage) => void,
  processServerMessage?: (serverMessage: any) => void
) => {
  const subscriptionError = useRef(false);
  const isMounted = useRef(true);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const subscriptionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { isSessionReady } = useApp();

  // Clean up function
  const cleanupSubscription = useCallback(() => {
    if (channelRef.current) {
      console.log(`Cleaning up subscription for conversation ${conversationId}`);
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }
    
    if (subscriptionTimeoutRef.current) {
      clearTimeout(subscriptionTimeoutRef.current);
      subscriptionTimeoutRef.current = null;
    }
  }, [conversationId]);

  // Clean up resources on unmount
  useEffect(() => {
    isMounted.current = true;
    
    return () => {
      isMounted.current = false;
      cleanupSubscription();
    };
  }, [cleanupSubscription]);

  // Setup subscription when conversation details and session are ready
  useEffect(() => {
    // Clean up any existing subscription
    cleanupSubscription();
    
    // Guard clause: early return if not ready
    if (!isSessionReady || !conversationId || !currentUserId || !otherUserId || conversationId === 'new') {
      return;
    }
    
    try {
      console.log(`[useDMSubscription] Setting up subscription for conversation ${conversationId}, session ready`);
      
      // Create a unique channel name with timestamp to avoid conflicts
      const channel = supabase
        .channel(`direct_messages:${conversationId}:${Date.now()}`)
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'direct_messages',
          filter: `conversation_id=eq.${conversationId}`
        }, (payload) => {
          if (!isMounted.current) return;
          
          console.log('New direct message received:', payload);
          
          const newMessage = payload.new;
          
          // Skip processing if sent by current user (will be handled by optimistic UI)
          if (newMessage.sender_id === currentUserId) {
            console.log('[useDMSubscription] Skipping own message');
            return;
          }
          
          // Use the processServerMessage function if provided, otherwise fall back to the old behavior
          if (processServerMessage) {
            processServerMessage(newMessage);
          } else {
            // Legacy processing
            const chatMessage: ChatMessage = {
              id: newMessage.id,
              text: newMessage.text,
              sender: {
                id: newMessage.sender_id,
                name: newMessage.sender_id === currentUserId ? 'You' : 'User',
              },
              timestamp: newMessage.timestamp
            };
            
            // Add the new message
            addMessage(chatMessage);
          }
        })
        .subscribe((status) => {
          console.log(`DM subscription status for ${conversationId}:`, status);
        });
      
      channelRef.current = channel;
      
      // Reset subscription error flag
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
  }, [isSessionReady, conversationId, currentUserId, otherUserId, setMessages, addMessage, cleanupSubscription, processServerMessage]);
};
