
import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ChatMessage } from '@/types/chat';
import { toast } from '@/hooks/use-toast';

const SUBSCRIPTION_DELAY_MS = 100; // Small delay before setting up subscription

export const useDMSubscription = (
  conversationId: string | undefined,
  otherUserId: string | undefined,
  currentUserId: string | undefined,
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>,
  addMessage: (message: ChatMessage) => void
) => {
  const subscriptionError = useRef(false);
  const subscriptionTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Clean up any existing timeout
    if (subscriptionTimeoutRef.current) {
      clearTimeout(subscriptionTimeoutRef.current);
    }
    
    // Guard clause: early return if we don't have necessary IDs
    if (!conversationId || !currentUserId || !otherUserId) {
      return;
    }
    
    // Set a small delay before setting up subscription
    subscriptionTimeoutRef.current = setTimeout(() => {
      try {
        console.log(`Setting up subscription for conversation ${conversationId} after delay`);
        
        const channel = supabase
          .channel(`direct_messages:${conversationId}`)
          .on('postgres_changes', {
            event: 'INSERT',
            schema: 'public',
            table: 'direct_messages',
            filter: `conversation_id=eq.${conversationId}`
          }, (payload) => {
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
            
            // Add the new message to the state
            addMessage(chatMessage);
          })
          .subscribe();
        
        // Reset subscription error flag
        subscriptionError.current = false;
        
        // Cleanup
        return () => {
          console.log(`Cleaning up subscription for conversation ${conversationId}`);
          supabase.removeChannel(channel);
        };
      } catch (error) {
        console.error('Error setting up DM subscription:', error);
        
        // Show toast only once
        if (!subscriptionError.current) {
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
    return () => {
      if (subscriptionTimeoutRef.current) {
        clearTimeout(subscriptionTimeoutRef.current);
      }
    };
  }, [conversationId, currentUserId, otherUserId, setMessages, addMessage]);
};
