import React from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Club } from '@/types';

export const useClubLastMessages = (clubs: Club[] = []) => {
  const [lastMessages, setLastMessages] = React.useState<Record<string, any>>({});

  React.useEffect(() => {
    if (!clubs?.length) {
      setLastMessages({});
      return;
    }

    const fetchLatestMessages = async () => {
      const clubIds = clubs.map(club => club.id);
      
      const { data, error } = await supabase
        .from('club_chat_messages')
        .select(`
          *,
          sender:sender_id (
            id,
            name
          )
        `)
        .in('club_id', clubIds)
        .order('timestamp', { ascending: false });

      if (error) {
        console.error('[useClubLastMessages] Error fetching messages:', error);
        return;
      }

      // Group messages by club_id and take only the most recent one
      const latestMessages = (data || []).reduce((acc: Record<string, any>, message) => {
        if (!acc[message.club_id]) {
          acc[message.club_id] = message;
        }
        return acc;
      }, {});

      setLastMessages(latestMessages);
    };

    fetchLatestMessages();

    const fetchLatestMessageForClub = async (clubId: string) => {
      const { data, error } = await supabase
        .from('club_chat_messages')
        .select(`*, sender:sender_id ( id, name )`)
        .eq('club_id', clubId)
        .order('timestamp', { ascending: false })
        .limit(1);
      if (error) {
        console.error('[useClubLastMessages] Error fetching latest message for club:', clubId, error);
        return null;
      }
      return data?.[0] || null;
    };

    // Set up realtime subscription for new messages
    const channel = supabase
      .channel('club-last-messages')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'club_chat_messages',
          filter: clubs.length > 0 ? `club_id=in.(${clubs.map(c => `'${c.id}'`).join(',')})` : undefined
        },
        async (payload) => {
          console.log('[useClubLastMessages] Real-time event:', payload);
          const msg = payload.new || payload.old;
          if (!msg?.club_id) return;
          
          if (payload.eventType === 'DELETE') {
            // On delete, refetch the latest message for this club only
            const latest = await fetchLatestMessageForClub(msg.club_id);
            setLastMessages(prev => ({ ...prev, [msg.club_id]: latest }));
          } else {
            // On insert/update, update lastMessages for this club only
            setLastMessages(prev => ({ ...prev, [msg.club_id]: msg }));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [clubs]);

  return { 
    lastMessages,
    _debug: { 
      lastMessagesKeys: Object.keys(lastMessages)
    }
  };
};
