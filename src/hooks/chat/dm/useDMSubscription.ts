
import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ChatMessage } from '@/types/chat';
import { toast } from '@/hooks/use-toast';
import debounce from 'lodash/debounce';

const SUBSCRIPTION_DELAY_MS = 300; // Increased delay before setting up subscription

export const useDMSubscription = (
  conversationId: string | undefined,
  otherUserId: string | undefined,
  currentUserId: string | undefined,
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>,
  addMessage: (message: ChatMessage) => void
) => {
  const subscriptionError = useRef(false);
  const subscriptionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isMounted = useRef(true);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // Debounced function to handle adding new messages
  const debouncedAddMessage = useRef(
    debounce((chatMessage: ChatMessage) => {
      if (isMounted.current) {
        addMessage(chatMessage);
      }
    }, 100)
  ).current;

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
      debouncedAddMessage.cancel();
      cleanupSubscription();
    };
  }, [cleanupSubscription, debouncedAddMessage]);

  // Setup subscription when conversation details change
  useEffect(() => {
    // Clean up any existing subscription
    cleanupSubscription();
    
    // Guard clause: early return if we don't have necessary IDs
    if (!conversationId || !currentUserId || !otherUserId) {
      return;
    }
    
    // Only set up subscription for actual conversation IDs
    if (conversationId === 'new') {
      return;
    }
    
    // Set a small delay before setting up subscription
    subscriptionTimeoutRef.current = setTimeout(() => {
      if (!isMounted.current) return;
      
      try {
        console.log(`Setting up subscription for conversation ${conversationId} after delay`);
        
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
            
            // Format the message for the UI
            const chatMessage: ChatMessage = {
              id: newMessage.id,
              text: newMessage.text,
              sender: {
                id: newMessage.sender_id,
                name: newMessage.sender_id === currentUserId ? 'You' : 'User',
              },
              timestamp: newMessage.timestamp
            };
            
            // Add the new message to the state using the debounced function
            debouncedAddMessage(chatMessage);
          })
          .subscribe((status) => {
            console.log(`DM subscription status for ${conversationId}:`, status);
          });
        
        channelRef.current = channel;
        
        // Reset subscription error flag
        subscriptionError.current = false;
      } catch (error) {
        console.error('Error setting up DM subscription:', error);
        
        // Show toast only once
        if (!subscriptionError.current && isMounted.current) {
          toast({
            title: "Connection Error",
            description: "Could not set up real-time updates for messages.",
            variant: "destructive"
          });
          subscriptionError.current = true;
        }
      }
    }, SUBSCRIPTION_DELAY_MS);
    
    // Clean up timeout on unmount or when dependencies change
    return cleanupSubscription;
  }, [conversationId, currentUserId, otherUserId, setMessages, addMessage, cleanupSubscription, debouncedAddMessage]);
};
