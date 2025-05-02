
import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ChatMessage } from '@/types/chat';
import { toast } from '@/hooks/use-toast';

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
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>
) => {
  const subscriptionError = useRef(false);
  const isMounted = useRef(true);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  
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
    };
  }, [cleanupSubscription]);

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
      
      const channel = supabase
        .channel(`direct_messages:${conversationId}`)
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
          
          // Look for a matching optimistic message
          setMessages(prevMessages => {
            const matchingOptimisticMessage = findMatchingOptimisticMessage(prevMessages, chatMessage);
            
            if (matchingOptimisticMessage) {
              console.log('[useDMSubscription] Found matching optimistic message, replacing:', matchingOptimisticMessage.id);
              // Replace the optimistic message with the confirmed one
              return prevMessages.map(msg => 
                msg.id === matchingOptimisticMessage.id ? chatMessage : msg
              );
            } else {
              console.log('[useDMSubscription] No matching optimistic message found, adding new message');
              
              // Dispatch an event for the new message to notify other components
              window.dispatchEvent(new CustomEvent('dmMessageReceived', { 
                detail: { conversationId, message: chatMessage } 
              }));
              
              return [...prevMessages, chatMessage];
            }
          });
        })
        .subscribe((status) => {
          console.log(`DM subscription status for ${conversationId}:`, status);
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
  }, [conversationId, currentUserId, otherUserId, setMessages, cleanupSubscription]);
};
