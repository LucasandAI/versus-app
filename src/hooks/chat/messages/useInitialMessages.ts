
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Club } from '@/types';
import { toast } from '@/hooks/use-toast';

export const useInitialMessages = (
  userClubs: Club[],
  isOpen: boolean,
  setClubMessages: React.Dispatch<React.SetStateAction<Record<string, any[]>>>
) => {
  useEffect(() => {
    if (!isOpen || !userClubs.length) return;

    const fetchClubMessages = async () => {
      console.log('[useInitialMessages] Fetching messages for all clubs');
      
      try {
        const messagesPromises = userClubs.map(async (club) => {
          console.log(`[useInitialMessages] Fetching messages for club ${club.id}`);
          
          const { data, error } = await supabase
            .from('club_chat_messages')
            .select(`
              id, 
              message, 
              timestamp, 
              sender_id, 
              club_id,
              sender:sender_id(id, name, avatar)
            `)
            .eq('club_id', club.id)
            .order('timestamp', { ascending: true });
              
          if (error) {
            console.error(`[useInitialMessages] Error fetching messages for club ${club.id}:`, error);
            return [club.id, []];
          }
          
          return [club.id, data || []];
        });
        
        const messagesResults = await Promise.all(messagesPromises);
        const clubMessagesMap: Record<string, any[]> = {};
        
        messagesResults.forEach(([clubId, messages]) => {
          if (typeof clubId === 'string') {
            clubMessagesMap[clubId] = Array.isArray(messages) ? messages : [];
          }
        });
        
        setClubMessages(clubMessagesMap);
      } catch (error) {
        console.error('[useInitialMessages] Error fetching club messages:', error);
        toast({
          title: "Error",
          description: "Failed to load chat messages",
          variant: "destructive"
        });
      }
    };
    
    fetchClubMessages();
  }, [userClubs, isOpen, setClubMessages]);
};
