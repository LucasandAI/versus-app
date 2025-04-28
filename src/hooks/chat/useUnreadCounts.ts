
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useUnreadCounts = (userId: string | undefined) => {
  const [dmUnreadCount, setDMUnreadCount] = useState(0);
  const [clubUnreadCount, setClubUnreadCount] = useState(0);
  const [unreadConversations, setUnreadConversations] = useState<Set<string>>(new Set());
  const [unreadClubs, setUnreadClubs] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!userId) return;

    const fetchUnreadCounts = async () => {
      try {
        // Fetch DM unread counts
        const { data: dmCount, error: dmError } = await supabase.rpc('get_unread_dm_count', {
          user_id: userId
        });
        
        if (dmError) throw dmError;
        setDMUnreadCount(dmCount || 0);

        // Fetch club unread counts
        const { data: clubCount, error: clubError } = await supabase.rpc('get_unread_club_messages_count', {
          user_id: userId
        });
        
        if (clubError) throw clubError;
        setClubUnreadCount(clubCount || 0);

        // Get unread conversations
        const { data: unreadDMs } = await supabase
          .from('direct_messages_read')
          .select('conversation_id')
          .eq('user_id', userId)
          .filter('has_unread', 'eq', true);

        setUnreadConversations(new Set(unreadDMs?.map(dm => dm.conversation_id)));

        // Get unread clubs
        const { data: unreadClubsData } = await supabase
          .from('club_messages_read')
          .select('club_id')
          .eq('user_id', userId)
          .filter('has_unread', 'eq', true);

        setUnreadClubs(new Set(unreadClubsData?.map(club => club.club_id)));
      } catch (error) {
        console.error('[useUnreadCounts] Error fetching unread counts:', error);
      }
    };

    fetchUnreadCounts();

    // Subscribe to new messages
    const dmChannel = supabase.channel('dm-notifications')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'direct_messages'
      }, (payload) => {
        if (payload.new.receiver_id === userId) {
          setDMUnreadCount(prev => prev + 1);
          setUnreadConversations(prev => new Set([...prev, payload.new.conversation_id]));
        }
      })
      .subscribe();

    const clubChannel = supabase.channel('club-notifications')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'club_chat_messages'
      }, (payload) => {
        if (payload.new.sender_id !== userId) {
          setClubUnreadCount(prev => prev + 1);
          setUnreadClubs(prev => new Set([...prev, payload.new.club_id]));
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(dmChannel);
      supabase.removeChannel(clubChannel);
    };
  }, [userId]);

  return {
    totalUnreadCount: dmUnreadCount + clubUnreadCount,
    dmUnreadCount,
    clubUnreadCount,
    unreadConversations,
    unreadClubs
  };
};
