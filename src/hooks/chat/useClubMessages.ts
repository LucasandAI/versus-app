
import { useState, useEffect, useRef } from 'react';
import { Club } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { useApp } from '@/context/AppContext';
import { useClubMessageSubscriptions } from '@/hooks/chat/messages/useClubMessageSubscriptions';

export const useClubMessages = (userClubs: Club[], isOpen: boolean) => {
  const [clubMessages, setClubMessages] = useState<Record<string, any[]>>({});
  const { currentUser } = useApp();
  const activeSubscriptionsRef = useRef<Record<string, boolean>>({});
  
  // Fetch initial messages when drawer opens
  useEffect(() => {
    if (!isOpen || !currentUser?.id || !userClubs.length) return;
    
    const fetchInitialMessages = async () => {
      try {
        // Get last 50 messages for each club
        const clubIds = userClubs.map(club => club.id);
        
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
          .in('club_id', clubIds)
          .order('timestamp', { ascending: false })
          .limit(50);
          
        if (error) throw error;
        
        if (data) {
          const messagesMap: Record<string, any[]> = {};
          
          // Group messages by club_id
          data.forEach(message => {
            if (!messagesMap[message.club_id]) {
              messagesMap[message.club_id] = [];
            }
            messagesMap[message.club_id].push(message);
          });
          
          // Sort messages by timestamp (oldest first) for each club
          Object.keys(messagesMap).forEach(clubId => {
            messagesMap[clubId] = messagesMap[clubId].sort(
              (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
            );
          });
          
          console.log('[useClubMessages] Initial messages fetched:', Object.keys(messagesMap).length);
          setClubMessages(messagesMap);
        }
      } catch (error) {
        console.error('[useClubMessages] Error fetching initial messages:', error);
      }
    };
    
    fetchInitialMessages();
  }, [isOpen, currentUser?.id, userClubs]);
  
  // Set up real-time subscription for messages
  useClubMessageSubscriptions(userClubs, isOpen, activeSubscriptionsRef, setClubMessages);
  
  const safeSetClubMessages = (updater: React.SetStateAction<Record<string, any[]>>) => {
    setClubMessages((prevState) => {
      const nextState = typeof updater === 'function' ? updater(prevState) : updater;
      console.log('[useClubMessages] Updating messages state:', {
        prevClubIds: Object.keys(prevState).length,
        nextClubIds: Object.keys(nextState).length
      });
      return nextState;
    });
  };
  
  return {
    clubMessages,
    setClubMessages: safeSetClubMessages
  };
};
