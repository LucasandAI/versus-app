
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Club } from '@/types';

export const useClubLastMessages = (clubs: Club[]) => {
  const [lastMessages, setLastMessages] = useState<Record<string, any>>({});
  const [sortedClubs, setSortedClubs] = useState<Club[]>([]);

  useEffect(() => {
    if (!clubs.length) {
      setSortedClubs([]);
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
      const latestMessages = data.reduce((acc: Record<string, any>, message) => {
        if (!acc[message.club_id]) {
          acc[message.club_id] = message;
        }
        return acc;
      }, {});

      setLastMessages(latestMessages);
      
      // Sort clubs by most recent message timestamp
      const clubsWithTimestamps = clubs.map(club => {
        const lastMessage = latestMessages[club.id];
        // Use the message timestamp or a default old date if no messages
        const lastTimestamp = lastMessage ? 
          new Date(lastMessage.timestamp).getTime() : 
          0;
        
        return {
          club,
          lastTimestamp
        };
      });
      
      // Sort by timestamp (most recent first)
      const sorted = clubsWithTimestamps
        .sort((a, b) => b.lastTimestamp - a.lastTimestamp)
        .map(item => item.club);
        
      setSortedClubs(sorted);
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

  return { lastMessages, sortedClubs: sortedClubs.length > 0 ? sortedClubs : clubs };
};
