
import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface UseFetchUnreadCountsParams {
  userId: string | undefined;
  setDmUnreadCount: (count: number) => void;
  setClubUnreadCount: (count: number) => void;
  setUnreadConversations: (conversations: Set<string>) => void;
  setUnreadClubs: (clubs: Set<string>) => void;
}

export function useFetchUnreadCounts({
  userId,
  setDmUnreadCount,
  setClubUnreadCount,
  setUnreadConversations,
  setUnreadClubs
}: UseFetchUnreadCountsParams) {
  
  const fetchUnreadCounts = useCallback(async () => {
    if (!userId) return;
    
    try {
      console.log('[UnreadMessagesContext] Fetching unread counts');
      
      // Fetch DM unread counts
      const { data: dmCount, error: dmError } = await supabase.rpc('get_unread_dm_count', {
        user_id: userId
      });
      
      if (dmError) throw dmError;
      setDmUnreadCount(dmCount || 0);

      // Fetch club unread counts
      const { data: clubCount, error: clubError } = await supabase.rpc('get_unread_club_messages_count', {
        user_id: userId
      });
      
      if (clubError) throw clubError;
      setClubUnreadCount(clubCount || 0);

      // Get unread conversations
      const { data: unreadDMs, error: unreadDMsError } = await supabase
        .from('direct_messages_read')
        .select('conversation_id')
        .eq('user_id', userId)
        .filter('has_unread', 'eq', true);

      if (unreadDMsError) throw unreadDMsError;
      
      if (unreadDMs) {
        setUnreadConversations(new Set(unreadDMs.map(dm => dm.conversation_id)));
      }

      // Get unread clubs
      const { data: unreadClubsData, error: unreadClubsError } = await supabase
        .from('club_messages_read')
        .select('club_id')
        .eq('user_id', userId)
        .filter('has_unread', 'eq', true);

      if (unreadClubsError) throw unreadClubsError;
      
      if (unreadClubsData) {
        setUnreadClubs(new Set(unreadClubsData.map(club => club.club_id)));
      }
      
      console.log('[UnreadMessagesContext] Unread counts fetched:', { dmCount, clubCount });
      
      // Dispatch event to notify UI components of changes
      window.dispatchEvent(new CustomEvent('unreadMessagesUpdated'));
      
    } catch (error) {
      console.error('[UnreadMessagesContext] Error fetching unread counts:', error);
    }
  }, [userId, setDmUnreadCount, setClubUnreadCount, setUnreadConversations, setUnreadClubs]);

  return { fetchUnreadCounts };
}
