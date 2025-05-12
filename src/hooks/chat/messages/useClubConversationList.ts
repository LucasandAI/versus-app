import React from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Club } from '@/types';

export interface ClubConversationPreview {
  club: Club;
  lastMessage: any | null;
}

export function useClubConversationList(clubs: Club[]) {
  const [conversations, setConversations] = React.useState<ClubConversationPreview[]>([]);

  // Helper to fetch the latest message for a club, joining sender info
  const fetchLastMessage = async (clubId: string) => {
    const { data, error } = await supabase
      .from('club_chat_messages')
      .select('*, sender:sender_id(id, name, avatar)')
      .eq('club_id', clubId)
      .order('timestamp', { ascending: false })
      .limit(1);
    if (error) return null;
    return data && data[0] ? data[0] : null;
  };

  // Fetch all latest messages on mount or clubs change
  React.useEffect(() => {
    let isMounted = true;
    const fetchAll = async () => {
      if (!clubs.length) {
        setConversations([]);
        return;
      }
      const previews: ClubConversationPreview[] = await Promise.all(
        clubs.map(async (club) => {
          const lastMessage = await fetchLastMessage(club.id);
          return { club, lastMessage };
        })
      );
      previews.sort((a, b) => {
        const tA = a.lastMessage ? new Date(a.lastMessage.timestamp).getTime() : 0;
        const tB = b.lastMessage ? new Date(b.lastMessage.timestamp).getTime() : 0;
        return tB - tA;
      });
      if (isMounted) setConversations(previews);
    };
    fetchAll();
    return () => { isMounted = false; };
  }, [clubs]);

  // Real-time subscription
  React.useEffect(() => {
    if (!clubs.length) return;
    const clubIds = clubs.map(c => c.id);
    const channel = supabase
      .channel('club-conversation-list-realtime')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'club_chat_messages',
        filter: `club_id=in.(${clubIds.map(id => `'${id}'`).join(',')})`
      }, async (payload) => {
        const clubId = payload.new?.club_id || payload.old?.club_id;
        if (!clubId) return;
        const lastMessage = await fetchLastMessage(clubId);
        setConversations(prev => {
          const updated = prev.map(conv =>
            conv.club.id === clubId ? { ...conv, lastMessage } : conv
          );
          // Resort
          updated.sort((a, b) => {
            const tA = a.lastMessage ? new Date(a.lastMessage.timestamp).getTime() : 0;
            const tB = b.lastMessage ? new Date(b.lastMessage.timestamp).getTime() : 0;
            return tB - tA;
          });
          return updated;
        });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [clubs]);

  return conversations;
} 