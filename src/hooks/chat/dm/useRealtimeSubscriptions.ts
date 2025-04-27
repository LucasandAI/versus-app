
import { useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { UserCache } from './types';

export const useRealtimeSubscriptions = (
  currentUserId: string | undefined,
  userCache: UserCache,
  fetchUserData: (userId: string) => Promise<any>,
  updateConversation: (otherUserId: string, newMessage: string, otherUserName?: string, otherUserAvatar?: string) => void
) => {
  useEffect(() => {
    if (!currentUserId) return;

    console.log('[useConversations] Setting up real-time subscriptions for user:', currentUserId);
    
    // Listen for messages sent by the current user
    const outgoingChannel = supabase
      .channel('dm-outgoing')
      .on('postgres_changes', 
        { 
          event: 'INSERT',
          schema: 'public',
          table: 'direct_messages',
          filter: `sender_id=eq.${currentUserId}`
        },
        (payload: any) => {
          console.log('[RealTime] Outgoing DM detected:', payload, 'timestamp:', new Date().toISOString());
          
          // For outgoing messages, other user is the receiver
          const receiverId = payload.new.receiver_id;
          const cachedUser = userCache[receiverId];
          
          if (cachedUser) {
            updateConversation(receiverId, payload.new.text, cachedUser.name, cachedUser.avatar);
          } else {
            fetchUserData(receiverId).then(userData => {
              if (userData) {
                updateConversation(receiverId, payload.new.text, userData.name, userData.avatar);
              }
            });
          }
        }
      )
      .subscribe();
    
    // Listen for messages received by the current user
    const incomingChannel = supabase
      .channel('dm-incoming')
      .on('postgres_changes', 
        { 
          event: 'INSERT',
          schema: 'public',
          table: 'direct_messages',
          filter: `receiver_id=eq.${currentUserId}`
        },
        async (payload: any) => {
          console.log('[RealTime] Incoming DM detected:', payload, 'timestamp:', new Date().toISOString());
          
          // For incoming messages, other user is the sender
          const senderId = payload.new.sender_id;
          const cachedUser = userCache[senderId];
          
          if (cachedUser) {
            updateConversation(senderId, payload.new.text, cachedUser.name, cachedUser.avatar);
          } else {
            const userData = await fetchUserData(senderId);
            if (userData) {
              updateConversation(senderId, payload.new.text, userData.name, userData.avatar);
            }
          }
        }
      )
      .subscribe();

    return () => {
      console.log('[useConversations] Cleaning up real-time subscriptions');
      supabase.removeChannel(outgoingChannel);
      supabase.removeChannel(incomingChannel);
    };
  }, [currentUserId, updateConversation, fetchUserData, userCache]);
};
