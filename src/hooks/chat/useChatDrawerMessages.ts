
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Club } from '@/types';
import { toast } from '@/hooks/use-toast';

export const useChatDrawerMessages = (userClubs: Club[], isOpen: boolean) => {
  const [clubMessages, setClubMessages] = useState<Record<string, any[]>>({});

  useEffect(() => {
    if (!userClubs.length || !isOpen) return;
    
    console.log('[ChatDrawerMessages] Fetching messages for clubs:', userClubs.length);
    
    const fetchClubMessages = async () => {
      try {
        const messagesPromises = userClubs.map(async (club) => {
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
            console.error(`[ChatDrawerMessages] Error fetching messages for club ${club.id}:`, error);
            return [club.id, []];
          }
          
          console.log(`[ChatDrawerMessages] Fetched ${data?.length || 0} messages for club ${club.id}`);
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
        console.error('[ChatDrawerMessages] Error fetching club messages:', error);
        toast({
          title: "Error",
          description: "Failed to load chat messages",
          variant: "destructive"
        });
      }
    };
    
    fetchClubMessages();
  }, [userClubs, isOpen]);

  return {
    clubMessages
  };
};
