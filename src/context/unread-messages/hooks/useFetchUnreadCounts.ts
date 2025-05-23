
import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface UseFetchUnreadCountsProps {
  currentUserId: string | undefined;
  isSessionReady: boolean;
  setDmUnreadCount: (count: number) => void;
  setClubUnreadCount: (count: number) => void;
  setUnreadConversations: (unread: Set<string>) => void;
  setUnreadClubs: (unread: Set<string>) => void;
  setUnreadMessagesPerConversation: (countMap: Record<string, number>) => void;
  setUnreadMessagesPerClub: (countMap: Record<string, number>) => void;
}

export const useFetchUnreadCounts = ({
  currentUserId,
  isSessionReady,
  setDmUnreadCount,
  setClubUnreadCount,
  setUnreadConversations,
  setUnreadClubs,
  setUnreadMessagesPerConversation,
  setUnreadMessagesPerClub
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

      // Query unread direct messages using the unread_by field
      const { data: directMessages } = await supabase
        .from('direct_messages')
        .select('id, conversation_id, timestamp')
        .contains('unread_by', [currentUserId]);
        
      // Identify unread conversations and count messages
      const unreadConvs = new Set<string>();
      const messagesPerConversation: Record<string, number> = {};
      
      directMessages?.forEach(msg => {
        if (msg.conversation_id) {
          unreadConvs.add(msg.conversation_id);
          // Count unread messages per conversation
          messagesPerConversation[msg.conversation_id] = (messagesPerConversation[msg.conversation_id] || 0) + 1;
        }
      });
      
      setUnreadConversations(unreadConvs);
      setUnreadMessagesPerConversation(messagesPerConversation);
      
      // Get user's clubs
      const { data: clubMembers } = await supabase
        .from('club_members')
        .select('club_id')
        .eq('user_id', currentUserId);
        
      if (!clubMembers?.length) {
        setUnreadClubs(new Set());
        setUnreadMessagesPerClub({});
        return;
      }
      
      const clubIds = clubMembers.map(member => member.club_id);
      
      console.log('[useFetchUnreadCounts] User club IDs:', clubIds);
      
      // Query unread club messages using the unread_by field
      const { data: clubMessages, error: clubMessagesError } = await supabase
        .from('club_chat_messages')
        .select('id, club_id')
        .in('club_id', clubIds)
        .contains('unread_by', [currentUserId]);
        
      if (clubMessagesError) {
        console.error('[useFetchUnreadCounts] Error fetching club messages:', clubMessagesError);
      }
      
      console.log('[useFetchUnreadCounts] Unread club messages found:', clubMessages?.length || 0);
      
      // Count unread club messages per club
      const unreadClubsSet = new Set<string>();
      const messagesPerClub: Record<string, number> = {};
      
      clubMessages?.forEach(msg => {
        if (msg.club_id) {
          unreadClubsSet.add(msg.club_id);
          messagesPerClub[msg.club_id] = (messagesPerClub[msg.club_id] || 0) + 1;
        }
      });
      
      console.log('[useFetchUnreadCounts] Unread clubs set:', Array.from(unreadClubsSet));
      setUnreadClubs(unreadClubsSet);
      setUnreadMessagesPerClub(messagesPerClub);
      
      console.log('[useFetchUnreadCounts] Unread counts fetched:', { 
        dmCount, 
        clubCount,
        unreadConversations: unreadConvs.size,
        unreadClubs: unreadClubsSet.size,
        messagesPerConversation,
        messagesPerClub
      });
      
      // Dispatch event to notify UI components of changes
      window.dispatchEvent(new CustomEvent('unreadMessagesUpdated'));
      
    } catch (error) {
      console.error('[useFetchUnreadCounts] Error fetching unread counts:', error);
    }
  }, [currentUserId, isSessionReady, setDmUnreadCount, setClubUnreadCount, setUnreadConversations, setUnreadClubs, setUnreadMessagesPerConversation, setUnreadMessagesPerClub]);

  return { fetchUnreadCounts };
};
