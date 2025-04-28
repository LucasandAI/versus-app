
import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ChatMessage } from '@/types/chat';
import { toast } from '@/hooks/use-toast';
import debounce from 'lodash/debounce';
import { useApp } from '@/context/AppContext';

// Helper function to find a matching optimistic message
const findMatchingOptimisticMessage = (
  messages: ChatMessage[], 
  confirmedMessage: ChatMessage
): ChatMessage | undefined => {
  // Only look for messages marked as optimistic
  const optimisticMessages = messages.filter(msg => msg.optimistic === true);
  
  return optimisticMessages.find(msg => {
    // Match by text content
    const textMatch = msg.text === confirmedMessage.text;
    
    // Match by sender ID
    const senderMatch = String(msg.sender.id) === String(confirmedMessage.sender.id);
    
    // Calculate time difference in seconds
    const msgTime = new Date(msg.timestamp).getTime();
    const confirmedTime = new Date(confirmedMessage.timestamp).getTime();
    const timeDifference = Math.abs(msgTime - confirmedTime) / 1000;
    
    // Allow for a 5 second window
    const timeMatch = timeDifference <= 5;
    
    return textMatch && senderMatch && timeMatch;
  });
};

export const useDMSubscription = (
  conversationId: string | undefined,
  otherUserId: string | undefined,
  currentUserId: string | undefined,
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>,
  addMessage: (message: ChatMessage) => void
) => {
  const subscriptionError = useRef(false);
  const isMounted = useRef(true);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const subscriptionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { isSessionReady } = useApp();

  // Debounced function to handle adding new messages
  const debouncedAddMessage = useRef(
    debounce((chatMessage: ChatMessage, currentMessages: ChatMessage[]) => {
      if (isMounted.current) {
        // Look for a matching optimistic message
        const matchingOptimisticMessage = findMatchingOptimisticMessage(currentMessages, chatMessage);
        
        if (matchingOptimisticMessage) {
          console.log('[useDMSubscription] Found matching optimistic message, replacing:', matchingOptimisticMessage.id);
          // Replace the optimistic message with the confirmed one
          setMessages(prevMessages => 
            prevMessages.map(msg => 
              msg.id === matchingOptimisticMessage.id ? chatMessage : msg
            )
          );
        } else {
          // No matching optimistic message found, add as normal
          console.log('[useDMSubscription] No matching optimistic message found, adding new message');
          addMessage(chatMessage);
        }
      }
    }, 100)
  ).current;

  // Clean up function
  const cleanupSubscription = useCallback(() => {
    if (channelRef.current) {
      console.log(`[useDMSubscription] Cleaning up subscription for conversation ${conversationId}`);
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
          
          console.log('[useDMSubscription] New direct message received:', payload);
          
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
          
          // Get current messages to check for optimistic matches
          setMessages(currentMessages => {
            // Use debounced function to handle adding or replacing messages
            debouncedAddMessage(chatMessage, currentMessages);
            return currentMessages;
          });
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
  }, [isSessionReady, conversationId, currentUserId, otherUserId, setMessages, addMessage, cleanupSubscription, debouncedAddMessage]);
};
