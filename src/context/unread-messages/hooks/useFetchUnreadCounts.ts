
import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface UseFetchUnreadCountsProps {
  currentUserId: string | undefined;
  isSessionReady: boolean;
  setDmUnreadCount: (count: number) => void;
  setClubUnreadCount: (count: number) => void;
  setUnreadConversations: (unread: Set<string>) => void;
  setUnreadClubs: (unread: Set<string>) => void;
}

export const useFetchUnreadCounts = ({
  currentUserId,
  isSessionReady,
  setDmUnreadCount,
  setClubUnreadCount,
  setUnreadConversations,
  setUnreadClubs
}: UseFetchUnreadCountsProps) => {
  
  const fetchUnreadCounts = useCallback(async () => {
    if (!isSessionReady || !currentUserId) return;
    
    try {
      console.log('[useFetchUnreadCounts] Fetching unread counts');
      
      // Fetch DM unread counts using the RPC function
      const { data: dmCount, error: dmError } = await supabase.rpc('get_unread_dm_count', {
        user_id: currentUserId
      });
      
      if (dmError) throw dmError;
      setDmUnreadCount(dmCount || 0);

      // Fetch club unread counts using the RPC function
      const { data: clubCount, error: clubError } = await supabase.rpc('get_unread_club_messages_count', {
        user_id: currentUserId
      });
      
      if (clubError) throw clubError;
      setClubUnreadCount(clubCount || 0);

      // Get unread conversations by fetching direct messages and read status
      const { data: directMessages } = await supabase
        .from('direct_messages')
        .select(`
          conversation_id,
          receiver_id,
          timestamp
        `)
        .eq('receiver_id', currentUserId);
        
      const { data: readStatus } = await supabase
        .from('direct_messages_read')
        .select('conversation_id, last_read_timestamp')
        .eq('user_id', currentUserId);
        
      // Build a map of conversation_id -> last_read_timestamp
      const readMap: Record<string, string> = {};
      readStatus?.forEach(status => {
        readMap[status.conversation_id] = status.last_read_timestamp;
      });
      
      // Identify unread conversations by comparing message timestamp with read timestamp
      const unreadConvs = new Set<string>();
      directMessages?.forEach(msg => {
        const lastRead = readMap[msg.conversation_id];
        if (!lastRead || new Date(msg.timestamp) > new Date(lastRead)) {
          unreadConvs.add(msg.conversation_id);
        }
      });
      
      setUnreadConversations(unreadConvs);
      
      // Similarly for club messages
      const { data: clubMembers } = await supabase
        .from('club_members')
        .select('club_id')
        .eq('user_id', currentUserId);
        
      if (!clubMembers?.length) {
        setUnreadClubs(new Set());
        return;
      }
      
      const clubIds = clubMembers.map(member => member.club_id);
      
      console.log('[useFetchUnreadCounts] User club IDs:', clubIds);
      
      // Get club messages
      const { data: clubMessages, error: clubMessagesError } = await supabase
        .from('club_chat_messages')
        .select('club_id, sender_id, timestamp')
        .in('club_id', clubIds)
        .neq('sender_id', currentUserId);
        
      if (clubMessagesError) {
        console.error('[useFetchUnreadCounts] Error fetching club messages:', clubMessagesError);
      }
      
      console.log('[useFetchUnreadCounts] Club messages found:', clubMessages?.length || 0);
      
      // Get club read status
      const { data: clubReadStatus, error: clubReadError } = await supabase
        .from('club_messages_read')
        .select('club_id, last_read_timestamp')
        .eq('user_id', currentUserId)
        .in('club_id', clubIds);
        
      if (clubReadError) {
        console.error('[useFetchUnreadCounts] Error fetching club read status:', clubReadError);
      }
      
      // Build a map of club_id -> last_read_timestamp
      const clubReadMap: Record<string, string> = {};
      clubReadStatus?.forEach(status => {
        clubReadMap[status.club_id] = status.last_read_timestamp;
      });
      
      console.log('[useFetchUnreadCounts] Club read statuses:', clubReadMap);
      
      // Identify unread club chats
      const unreadClubsSet = new Set<string>();
      clubMessages?.forEach(msg => {
        const lastRead = clubReadMap[msg.club_id];
        if (!lastRead || new Date(msg.timestamp) > new Date(lastRead)) {
          unreadClubsSet.add(msg.club_id);
          console.log(`[useFetchUnreadCounts] Club ${msg.club_id} has unread messages. Last message: ${msg.timestamp}, Last read: ${lastRead || 'never'}`);
        }
      });
      
      console.log('[useFetchUnreadCounts] Unread clubs set:', Array.from(unreadClubsSet));
      setUnreadClubs(unreadClubsSet);
      
      console.log('[useFetchUnreadCounts] Unread counts fetched:', { 
        dmCount, 
        clubCount,
        unreadConversations: unreadConvs.size,
        unreadClubs: unreadClubsSet.size
      });
      
      // Dispatch event to notify UI components of changes
      window.dispatchEvent(new CustomEvent('unreadMessagesUpdated'));
      
    } catch (error) {
      console.error('[useFetchUnreadCounts] Error fetching unread counts:', error);
    }
  }, [currentUserId, isSessionReady, setDmUnreadCount, setClubUnreadCount, setUnreadConversations, setUnreadClubs]);

  return { fetchUnreadCounts };
};
