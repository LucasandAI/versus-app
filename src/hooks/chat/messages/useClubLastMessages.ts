import React from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Club } from '@/types';

export const useClubLastMessages = (clubs: Club[]) => {
  const [lastMessages, setLastMessages] = React.useState<Record<string, any>>({});
  const lastMessagesRef = React.useRef<Record<string, any>>({});
  const [sortedClubs, setSortedClubs] = React.useState<Club[]>([]);
  const [forceUpdate, setForceUpdate] = React.useState(0); // dummy state to force re-render

  // Always keep the ref in sync with state
  React.useEffect(() => {
    lastMessagesRef.current = lastMessages;
  }, [lastMessages]);

  React.useEffect(() => {
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
      
      // Sort clubs by most recent message timestamp - no memoization, direct sorting on every update
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
      
      // Sort by timestamp (most recent first) - No memoization, direct sorting
      const sorted = clubsWithTimestamps
        .sort((a, b) => b.lastTimestamp - a.lastTimestamp)
        .map(item => item.club);
        
      // Update sorted clubs directly
      setSortedClubs(sorted);
      setForceUpdate(f => f + 1); // force re-render
      console.log('[useClubLastMessages] Setting sorted clubs and forcing update:', sorted);
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
      return data && data[0] ? data[0] : null;
    };

    const updateAndResort = (updatedLastMessages: Record<string, any>) => {
      setLastMessages(updatedLastMessages);
      lastMessagesRef.current = updatedLastMessages;
      // Resort clubs by latest timestamp
      const clubsWithTimestamps = clubs.map(club => {
        const lastMessage = updatedLastMessages[club.id];
        const lastTimestamp = lastMessage ? new Date(lastMessage.timestamp).getTime() : 0;
        return { club, lastTimestamp };
      });
      const sorted = clubsWithTimestamps
        .sort((a, b) => b.lastTimestamp - a.lastTimestamp)
        .map(item => item.club);
      setSortedClubs(sorted);
      setForceUpdate(f => f + 1);
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
          if (!msg || !msg.club_id) return;
          if (payload.eventType === 'DELETE') {
            // On delete, refetch the latest message for this club only
            const latest = await fetchLatestMessageForClub(msg.club_id);
            const updatedLastMessages = { ...lastMessagesRef.current, [msg.club_id]: latest };
            updateAndResort(updatedLastMessages);
          } else {
            // On insert/update, update lastMessages for this club only
            const updatedLastMessages = { ...lastMessagesRef.current, [msg.club_id]: msg };
            updateAndResort(updatedLastMessages);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [clubs]);

  // Return without any memoization to ensure fresh data on each render
  return { 
    lastMessages, 
    sortedClubs: sortedClubs.length > 0 ? sortedClubs : clubs,
    _debug: { 
      lastMessagesKeys: Object.keys(lastMessages),
      sortedClubIds: sortedClubs.map(c => c.id),
      forceUpdate
    }
  };
};
