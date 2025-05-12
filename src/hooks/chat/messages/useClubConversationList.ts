import React from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Club } from '@/types';

export interface ClubConversationPreview {
  club: Club;
  lastMessage: any | null;
}

export function useClubConversationList(clubs: Club[]) {
  console.log('[useClubConversationList] Hook called with clubs:', clubs.map(c => c.id));
  const [conversations, setConversations] = React.useState<ClubConversationPreview[]>([]);

  // Memoize clubIds for effect dependencies
  const clubIds = React.useMemo(() => clubs.map(c => c.id), [clubs]);

  // Helper to fetch the latest message for a club from the view
  const fetchLastMessage = async (clubId: string) => {
    const { data, error } = await supabase
      .from('club_chat_messages_with_usernames')
      .select('*')
      .eq('club_id', clubId)
      .order('timestamp', { ascending: false })
      .limit(1);
    console.log('[fetchLastMessage]', { clubId, data, error });
    if (error) return null;
    return data && data[0] ? data[0] : null;
  };

  // Memoize fetchAll to only depend on clubIds
  const fetchAll = React.useCallback(async () => {
    if (!clubIds.length) {
      setConversations([]);
      return;
    }
    const previews: ClubConversationPreview[] = await Promise.all(
      clubIds.map(async (clubId) => {
        const club = clubs.find(c => c.id === clubId);
        const lastMessage = await fetchLastMessage(clubId);
        return { club, lastMessage };
      })
    );
    previews.sort((a, b) => {
      const tA = a.lastMessage ? new Date(a.lastMessage.timestamp).getTime() : 0;
      const tB = b.lastMessage ? new Date(b.lastMessage.timestamp).getTime() : 0;
      return tB - tA;
    });
    setConversations(previews);
    console.log('[useClubConversationList] fetchAll setConversations:', previews);
  }, [clubIds, clubs]);

  // Initial fetch
  React.useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // Real-time subscription: on any event, re-fetch all
  React.useEffect(() => {
    console.log('[useClubConversationList] Real-time effect running with clubs:', clubs.map(c => c.id));
    if (!clubIds.length) return;
    const channel = supabase
      .channel('club-conversation-list-realtime')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'club_chat_messages',
        filter: `club_id=in.(${clubIds.map(id => `'${id}'`).join(',')})`
      }, async (payload) => {
        console.log('[useClubConversationList] Real-time event received:', payload);
        await fetchAll();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [clubIds, fetchAll]);

  console.log('[useClubConversationList] Returning conversations:', conversations);
  return conversations;
} 