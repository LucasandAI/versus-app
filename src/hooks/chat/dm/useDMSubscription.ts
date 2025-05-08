import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ChatMessage } from '@/types/chat';
import { toast } from '@/hooks/use-toast';
import { useUserData } from './useUserData';

// Debounce time for message processing (in ms)
const DEBOUNCE_TIME = 300;

// Map to track messages that have been processed
const processedMessages = new Map<string, number>();

// Add otherUserData parameter to receive the full user object
export const useDMSubscription = (
  conversationId: string | undefined,
  otherUserId: string | undefined,
  currentUserId: string | undefined,
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>,
  otherUserData?: { id: string; name: string; avatar?: string } // New parameter for the full user object
) => {
  const subscriptionError = useRef(false);
  const isMounted = useRef(true);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const processingRef = useRef<boolean>(false);
  const { userCache, fetchUserData } = useUserData();
  
  // Store the user data in a ref to ensure it's stable across renders
  const otherUserDataRef = useRef(otherUserData);
  
  // Keep stable references to the conversation/user IDs
  const stableConversationId = useRef(conversationId);
  const stableOtherUserId = useRef(otherUserId);
  
  // Update stable refs when props change
  useEffect(() => {
    stableConversationId.current = conversationId;
    stableOtherUserId.current = otherUserId;
    otherUserDataRef.current = otherUserData;
  }, [conversationId, otherUserId, otherUserData]);
  
  // Clean up function
  const cleanupSubscription = useCallback(() => {
    if (channelRef.current) {
      console.log(`[useDMSubscription] Cleaning up subscription for conversation ${stableConversationId.current}`);
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }
  }, []);

  // Clean up resources on unmount
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
      cleanupSubscription();
    };
  }, [cleanupSubscription]);

  // Enhanced message handler with debouncing and deduping
  const handleNewMessage = useCallback(async (payload: any) => {
    if (!isMounted.current) return;
    
    const newMessage = payload.new;
    if (!newMessage || !newMessage.id) return;
    
    // Skip processing if we've seen this message recently (dedupe)
    const messageKey = `dm-${newMessage.id}`;
    const now = Date.now();
    if (processedMessages.has(messageKey)) {
      const lastProcessed = processedMessages.get(messageKey) || 0;
      if (now - lastProcessed < DEBOUNCE_TIME) {
        console.log('[useDMSubscription] Skipping duplicate message (debounced):', messageKey);
        return;
      }
    }
    
    // Mark as processed to prevent duplicates
    processedMessages.set(messageKey, now);
    
    // Clean up processed message after a delay
    setTimeout(() => {
      processedMessages.delete(messageKey);
    }, DEBOUNCE_TIME * 2);
    
    if (processingRef.current) {
      return;
    }
    
    processingRef.current = true;
    
    try {
      // Determine if this message is from the other user
      const senderId = newMessage.sender_id;
      const stable_otherUserId = stableOtherUserId.current;
      
      if (!stable_otherUserId) {
        processingRef.current = false;
        return;
      }
      
      const isFromOtherUser = senderId === stable_otherUserId;
      
      // Format message data based on sender
      let senderName = 'You';
      let senderAvatar: string | undefined = undefined;
      
      if (isFromOtherUser) {
        // Use the data provided directly in props if available
        if (otherUserDataRef.current) {
          // Use the data provided directly in props
          senderName = otherUserDataRef.current.name;
          senderAvatar = otherUserDataRef.current.avatar;
        } else {
          // Fall back to cache as a secondary option
          const cachedUserData = userCache[senderId];
          
          if (cachedUserData) {
            senderName = cachedUserData.name;
            senderAvatar = cachedUserData.avatar;
          } else {
            // Last resort - fetch it directly
            try {
              const userData = await fetchUserData(senderId);
              if (userData) {
                senderName = userData.name;
                senderAvatar = userData.avatar;
              }
            } catch (err) {
              console.warn(`[useDMSubscription] Failed to get user data for ${senderId}`);
            }
          }
        }
      }
      
      // Format the message for the UI with complete sender metadata
      const chatMessage: ChatMessage = {
        id: newMessage.id,
        text: newMessage.text,
        sender: {
          id: newMessage.sender_id,
          name: senderName,
          avatar: senderAvatar
        },
        timestamp: newMessage.timestamp
      };
      
      // Update UI via requestAnimationFrame to prevent jank
      requestAnimationFrame(() => {
        if (isMounted.current) {
          // Dispatch event first, then update local state
          const conversationId = stableConversationId.current;
          if (conversationId) {
            window.dispatchEvent(new CustomEvent('dmMessageReceived', { 
              detail: { 
                conversationId, 
                message: chatMessage 
              } 
            }));
          }
        }
        processingRef.current = false;
      });
    } catch (error) {
      console.error('[useDMSubscription] Error processing message:', error);
      processingRef.current = false;
    }
  }, [userCache, fetchUserData]);
  
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
      
      // Use our stable reference
      const conversation_id = conversationId;
      
      const channel = supabase
        .channel(`direct_messages:${conversation_id}`)
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'direct_messages',
          filter: `conversation_id=eq.${conversation_id}`
        }, handleNewMessage)
        .subscribe((status) => {
          console.log(`DM subscription status for ${conversation_id}:`, status);
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
  }, [conversationId, currentUserId, otherUserId, cleanupSubscription, handleNewMessage]);
};
