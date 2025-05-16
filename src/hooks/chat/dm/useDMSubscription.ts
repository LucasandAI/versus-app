import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ChatMessage } from '@/types/chat';
import { toast } from '@/hooks/use-toast';
import { useUserData } from './useUserData';

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
  const processedMessages = useRef<Set<string>>(new Set());
  const { userCache, fetchUserData } = useUserData();
  
  // Store the user data in a ref to ensure it's stable across renders
  const otherUserDataRef = useRef(otherUserData);
  
  // Flag to track if this conversation is active/being viewed
  const isActiveRef = useRef<boolean>(true);
  
  // Keep stable references to the conversation/user IDs
  const stableConversationId = useRef(conversationId);
  const stableOtherUserId = useRef(otherUserId);
  
  // Update stable refs when props change
  useEffect(() => {
    stableConversationId.current = conversationId;
    stableOtherUserId.current = otherUserId;
    otherUserDataRef.current = otherUserData;
    
    // When component mounts or conversationId changes, mark as active
    if (conversationId && conversationId !== 'new') {
      console.log(`[useDMSubscription] Marking conversation ${conversationId} as active`);
      isActiveRef.current = true;
      window.dispatchEvent(new CustomEvent('conversationActive', { 
        detail: { conversationId } 
      }));
    }
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
      
      // Mark conversation as inactive when component unmounts
      if (stableConversationId.current && stableConversationId.current !== 'new') {
        console.log(`[useDMSubscription] Marking conversation ${stableConversationId.current} as inactive on unmount`);
        window.dispatchEvent(new CustomEvent('conversationInactive', { 
          detail: { conversationId: stableConversationId.current } 
        }));
      }
      
      // Clear processed messages cache on unmount
      processedMessages.current.clear();
    };
  }, [cleanupSubscription]);

  // Fetch other user's data only if not provided in props
  useEffect(() => {
    if (otherUserId && !otherUserData) {
      console.log(`[useDMSubscription] No user data provided for ${otherUserId}, fetching from cache or API`);
      fetchUserData(otherUserId).then(userData => {
        console.log(`[useDMSubscription] User data available:`, userData);
      }).catch(err => {
        console.error(`[useDMSubscription] Error fetching user data:`, err);
      });
    } else if (otherUserData) {
      console.log(`[useDMSubscription] Using provided user data for ${otherUserId}:`, otherUserData);
    }
  }, [otherUserId, fetchUserData, otherUserData]);

  // Clear processed message cache when conversation changes
  useEffect(() => {
    if (conversationId) {
      processedMessages.current = new Set();
    }
  }, [conversationId]);

  // Set up listeners for active/inactive status events
  useEffect(() => {
    if (!conversationId || conversationId === 'new') return;
    
    const handleInactive = (event: CustomEvent) => {
      if (event.detail.conversationId === conversationId) {
        console.log(`[useDMSubscription] Conversation ${conversationId} marked as inactive via event`);
        isActiveRef.current = false;
      }
    };
    
    const handleActive = (event: CustomEvent) => {
      if (event.detail.conversationId === conversationId) {
        console.log(`[useDMSubscription] Conversation ${conversationId} marked as active via event`);
        isActiveRef.current = true;
      }
    };
    
    window.addEventListener('conversationInactive', handleInactive as EventListener);
    window.addEventListener('conversationActive', handleActive as EventListener);
    
    return () => {
      window.removeEventListener('conversationInactive', handleInactive as EventListener);
      window.removeEventListener('conversationActive', handleActive as EventListener);
    };
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
      
      // Use our stable reference
      const conversation_id = conversationId;
      const stable_otherUserId = otherUserId;
      
      const channel = supabase
        .channel(`direct_messages:${conversation_id}`)
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'direct_messages',
          filter: `conversation_id=eq.${conversation_id}`
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
          
          // Determine if this message is from the other user
          const senderId = newMessage.sender_id;
          const isFromOtherUser = senderId === stable_otherUserId;
          
          // Format message data based on sender
          let senderName = 'You';
          let senderAvatar: string | undefined = undefined;
          
          if (isFromOtherUser) {
            // It's from the other user, use the data provided in props directly
            if (otherUserDataRef.current) {
              // Use the data provided directly in props
              senderName = otherUserDataRef.current.name;
              senderAvatar = otherUserDataRef.current.avatar;
              console.log(`[useDMSubscription] Using provided user data for message from ${senderId}:`, {
                name: senderName,
                avatar: senderAvatar
              });
            } else {
              // Fall back to cache as a secondary option (this should rarely happen)
              const cachedUserData = userCache[senderId];
              
              if (cachedUserData) {
                console.log(`[useDMSubscription] Using cached user data for ${senderId}:`, cachedUserData);
                senderName = cachedUserData.name;
                senderAvatar = cachedUserData.avatar;
              } else {
                // Last resort - fetch it directly
                console.log(`[useDMSubscription] No user data available for ${senderId}, fetching`);
                const userData = await fetchUserData(senderId);
                
                if (userData) {
                  senderName = userData.name;
                  senderAvatar = userData.avatar;
                  console.log(`[useDMSubscription] Fetched user data for ${senderId}:`, userData);
                } else {
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
          
          console.log('[useDMSubscription] Adding message to UI:', {
            messageId,
            senderName: chatMessage.sender.name,
            conversationActive: isActiveRef.current
          });
          
          // Always update the UI with the new message if it's currently being viewed
          if (isActiveRef.current) {
            setMessages(prev => {
              // Make sure we don't add duplicates
              if (prev.some(m => m.id === chatMessage.id)) {
                return prev;
              }
              return [...prev, chatMessage].sort(
                (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
              );
            });
          }
          
          // Only trigger the unread event if this conversation is NOT active and message is from other user
          if (!isActiveRef.current && isFromOtherUser) {
            // Use the stable reference to event dispatch
            console.log(`[useDMSubscription] Triggering unread event for inactive conversation ${conversation_id}`);
            window.dispatchEvent(new CustomEvent('dmMessageReceived', { 
              detail: { 
                conversationId: conversation_id, 
                message: chatMessage,
                shouldMarkUnread: true
              } 
            }));
          } else {
            // Still dispatch the event but mark it as "don't trigger unread"
            console.log(`[useDMSubscription] Triggering message event for active conversation ${conversation_id}`);
            window.dispatchEvent(new CustomEvent('dmMessageReceived', { 
              detail: { 
                conversationId: conversation_id, 
                message: chatMessage,
                shouldMarkUnread: false
              } 
            }));
          }
        })
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
  }, [conversationId, currentUserId, otherUserId, userCache, cleanupSubscription, fetchUserData, setMessages]);
};
