
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Club } from '@/types';

export const useRealtimeChat = (
  currentUserId: string | undefined,
  userClubs: Club[]
) => {
  useEffect(() => {
    if (!currentUserId) return;
    
    // Subscribe to club messages for the user's clubs
    const channel = supabase
      .channel('chat-updates')
      .on(
        'postgres_changes',
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'club_chat_messages',
          filter: `club_id=in.(${userClubs.map(club => `'${club.id}'`).join(',')})` 
        },
        (payload) => {
          if (payload.new.sender_id !== currentUserId) {
            // Update unread count if the message is not from current user
            const clubId = payload.new.club_id;
            
            // Dispatch event to update unread messages
            const event = new CustomEvent('unreadMessagesUpdated', { 
              detail: { clubId }
            });
            window.dispatchEvent(event);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUserId, userClubs]);
};
