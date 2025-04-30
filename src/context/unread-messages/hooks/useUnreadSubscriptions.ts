
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface UseUnreadSubscriptionsProps {
  currentUserId: string | undefined;
  isSessionReady: boolean;
  markConversationAsUnread: (conversationId: string) => void;
  markClubAsUnread: (clubId: string) => void;
  fetchUnreadCounts: () => Promise<void>;
}

export const useUnreadSubscriptions = ({
  currentUserId,
  isSessionReady,
  markConversationAsUnread,
  markClubAsUnread,
  fetchUnreadCounts
}: UseUnreadSubscriptionsProps) => {
  
  useEffect(() => {
    if (!isSessionReady || !currentUserId) return;
    
    console.log('[useUnreadSubscriptions] Setting up realtime subscriptions for user:', currentUserId);
    
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
            console.log('[useUnreadSubscriptions] New DM received:', payload);
            if (payload.new.receiver_id === currentUserId) {
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
            console.log('[useUnreadSubscriptions] New club message received:', payload);
            if (payload.new.sender_id !== currentUserId) {
              console.log(`[useUnreadSubscriptions] Marking club ${payload.new.club_id} as unread`);
              markClubAsUnread(payload.new.club_id);
            }
          })
      .subscribe();
      
    // Initial fetch of unread counts
    fetchUnreadCounts();
      
    return () => {
      supabase.removeChannel(dmChannel);
      supabase.removeChannel(clubChannel);
    };
  }, [currentUserId, isSessionReady, markConversationAsUnread, markClubAsUnread, fetchUnreadCounts]);
};
