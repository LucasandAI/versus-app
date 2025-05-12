import React from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Club } from '@/types';

export interface ClubConversation {
  club: Club;
  lastMessage: any | null;
}

function normalizeMessage(msg: any): any {
  if (!msg) return null;
  return {
    ...msg,
    text: msg.text || msg.message || '',
  };
}

export function useClubConversations(clubs: Club[]) {
  const [conversations, setConversations] = React.useState<ClubConversation[]>([]);

  // Helper to fetch the latest message for a club
  const fetchLastMessage = async (clubId: string) => {
    const { data, error } = await supabase
      .from('club_chat_messages')
      .select('*')
      .eq('club_id', clubId)
      .order('timestamp', { ascending: false })
      .limit(1);
    if (error) return null;
    return data && data[0] ? normalizeMessage(data[0]) : null;
  };

  // Initial fetch and setup
  React.useEffect(() => {
    let isMounted = true;
    const fetchAll = async () => {
      const clubIds = clubs.map(c => c.id);
      if (!clubIds.length) {
        setConversations([]);
        return;
      }
      const { data, error } = await supabase
        .from('club_chat_messages')
        .select('*')
        .in('club_id', clubIds)
        .order('timestamp', { ascending: false });
      if (error) return;
      const latestByClub: Record<string, any> = {};
      data.forEach(msg => {
        if (!latestByClub[msg.club_id]) {
          latestByClub[msg.club_id] = normalizeMessage(msg);
        }
      });
      const arr: ClubConversation[] = clubs.map(club => ({
        club,
        lastMessage: latestByClub[club.id] || null
      }));
      arr.sort((a, b) => {
        const tA = a.lastMessage ? new Date(a.lastMessage.timestamp).getTime() : 0;
        const tB = b.lastMessage ? new Date(b.lastMessage.timestamp).getTime() : 0;
        return tB - tA;
      });
      if (isMounted) setConversations(arr);
    };
    fetchAll();
    return () => { isMounted = false; };
  }, [clubs]);

  // Real-time subscription
  React.useEffect(() => {
    if (!clubs.length) return;
    const clubIds = clubs.map(c => c.id);
    const channel = supabase
      .channel('club-conversations-realtime')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'club_chat_messages',
        filter: `club_id=in.(${clubIds.map(id => `'${id}'`).join(',')})`
      }, async (payload) => {
        const clubId = payload.new?.club_id || payload.old?.club_id;
        if (!clubId) return;
        const latest = await fetchLastMessage(clubId);
        setConversations(prev => {
          const updated = prev.map(conv =>
            conv.club.id === clubId ? { ...conv, lastMessage: latest } : conv
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