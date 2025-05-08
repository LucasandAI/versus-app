
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Club } from '@/types';

export const useInitialMessages = (
  clubs: Club[],
  isDrawerOpen: boolean
) => {
  const [clubMessages, setClubMessages] = useState<Record<string, any[]>>({});
  const [loading, setLoading] = useState(false);

  // Fetch initial club messages
  useEffect(() => {
    if (!clubs.length || !isDrawerOpen) return;

    const fetchClubMessages = async () => {
      setLoading(true);
      
      try {
        const clubIds = clubs.map(club => club.id);
        
        // Only fetch for clubs that don't already have messages loaded
        const clubsToFetch = clubIds.filter(id => !clubMessages[id]);
        
        if (clubsToFetch.length === 0) {
          return;
        }
        
        const { data, error } = await supabase
          .from('club_chat_messages')
          .select(`
            id, 
            message, 
            sender_id, 
            club_id, 
            timestamp,
            sender:sender_id (
              id, 
              name, 
              avatar
            )
          `)
          .in('club_id', clubsToFetch)
          .order('timestamp', { ascending: true })
          .limit(30);
          
        if (error) throw error;
        
        if (data) {
          const messagesByClub: Record<string, any[]> = {};
          
          // Group messages by club_id
          data.forEach(message => {
            const clubId = message.club_id;
            if (!messagesByClub[clubId]) {
              messagesByClub[clubId] = [];
            }
            messagesByClub[clubId].push(message);
          });
          
          // Update state with new messages
          setClubMessages(prev => ({
            ...prev,
            ...messagesByClub
          }));
        }
      } catch (error) {
        console.error('[useInitialMessages] Error fetching messages:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchClubMessages();
  }, [clubs, isDrawerOpen]); // Don't include clubMessages in deps to avoid loops

  const clearMessages = () => {
    setClubMessages({});
  };

  return {
    clubMessages,
    setClubMessages,
    loading,
    clearMessages
  };
};
