
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
    };
  }, [cleanupSubscription]);

  // Fetch other user's data if needed
  useEffect(() => {
    if (otherUserId && !userCache[otherUserId]) {
      fetchUserData(otherUserId);
    }
  }, [otherUserId, userCache, fetchUserData]);

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
        }, async (payload) => {
          if (!isMounted.current) return;
          
          console.log('[useDMSubscription] New direct message received:', payload);
          
          const newMessage = payload.new;
          
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
          
          // Dispatch a custom event instead of directly updating state
          window.dispatchEvent(new CustomEvent('dmMessageReceived', { 
            detail: { conversationId, message: chatMessage } 
          }));
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
  }, [conversationId, currentUserId, otherUserId, userCache, cleanupSubscription, fetchUserData]);
};
