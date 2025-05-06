
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Club } from '@/types';

export const useClubLastMessages = (clubs: Club[]) => {
  const [lastMessages, setLastMessages] = useState<Record<string, any>>({});

  useEffect(() => {
    if (!clubs.length) return;

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
      const latestMessages = data.reduce((acc: Record<string, any>, message) => {
        if (!acc[message.club_id]) {
          acc[message.club_id] = message;
        }
        return acc;
      }, {});

      setLastMessages(latestMessages);
    };

    fetchLatestMessages();

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
        () => {
          fetchLatestMessages(); // Refresh messages when changes occur
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [clubs]);

  return lastMessages;
};
