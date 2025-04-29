
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface UseUnreadSubscriptionsParams {
  userId: string | undefined;
  isSessionReady: boolean;
  markConversationAsUnread: (conversationId: string) => void;
  markClubAsUnread: (clubId: string) => void;
}

export function useUnreadSubscriptions({
  userId,
  isSessionReady,
  markConversationAsUnread,
  markClubAsUnread
}: UseUnreadSubscriptionsParams) {
  
  // Set up real-time subscriptions
  useEffect(() => {
    if (!isSessionReady || !userId) return;
    
    // Set up real-time subscriptions for new messages
    const dmChannel = supabase
      .channel('global-dm-unread-tracking')
      .on('postgres_changes', 
          { 
            event: 'INSERT', 
            schema: 'public', 
            table: 'direct_messages' 
          },
          (payload) => {
            if (payload.new.receiver_id === userId) {
              markConversationAsUnread(payload.new.conversation_id);
            }
          })
      .subscribe();
    
    // Subscribe to new club messages
    const clubChannel = supabase.channel('global-club-unread-tracking')
      .on('postgres_changes', 
          { 
            event: 'INSERT', 
            schema: 'public', 
            table: 'club_chat_messages'
          },
          (payload) => {
            if (payload.new.sender_id !== userId) {
              markClubAsUnread(payload.new.club_id);
            }
          })
      .subscribe();
      
    return () => {
      supabase.removeChannel(dmChannel);
      supabase.removeChannel(clubChannel);
    };
  }, [userId, isSessionReady, markConversationAsUnread, markClubAsUnread]);
}
