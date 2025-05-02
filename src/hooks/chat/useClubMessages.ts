
import { useState, useEffect, useRef, useCallback } from 'react';
import { Club } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { useApp } from '@/context/AppContext';
import { useClubMessageSubscriptions } from '@/hooks/chat/messages/useClubMessageSubscriptions';

export const useClubMessages = (userClubs: Club[], isOpen: boolean) => {
  const [clubMessages, setClubMessages] = useState<Record<string, any[]>>({});
  const [messageUpdateCounter, setMessageUpdateCounter] = useState(0); // Debug counter
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
          
          console.log('[useClubMessages] Initial message fetch complete:', Object.keys(messagesMap).map(
            clubId => `${clubId}: ${messagesMap[clubId].length} messages`
          ));
          
          setClubMessages(messagesMap);
        }
      } catch (error) {
        console.error('[useClubMessages] Error fetching initial messages:', error);
      }
    };
    
    fetchInitialMessages();
  }, [isOpen, currentUser?.id, userClubs]);
  
  // Enhanced wrapper for setClubMessages with more detailed tracking
  const wrappedSetClubMessages = useCallback((update: React.SetStateAction<Record<string, any[]>>) => {
    setMessageUpdateCounter(prev => prev + 1);
    const count = messageUpdateCounter + 1;
    
    console.log(`[useClubMessages] (#${count}) Updating club messages`);
    
    if (typeof update === 'function') {
      setClubMessages(prev => {
        const newMessages = update(prev);
        console.log(`[useClubMessages] (#${count}) Updated messages:`, 
          Object.keys(newMessages).map(clubId => `${clubId}: ${newMessages[clubId]?.length || 0} messages`));
          
        // IMPORTANT: Create an entirely new object reference to ensure React re-renders
        return JSON.parse(JSON.stringify(newMessages));
      });
    } else {
      console.log(`[useClubMessages] (#${count}) Direct update with:`, 
        Object.keys(update).map(clubId => `${clubId}: ${update[clubId]?.length || 0} messages`));
      
      // IMPORTANT: Create an entirely new object reference to ensure React re-renders
      setClubMessages(JSON.parse(JSON.stringify(update)));
    }
  }, [messageUpdateCounter]);
  
  // Set up real-time subscription for messages
  useClubMessageSubscriptions(userClubs, isOpen, activeSubscriptionsRef, wrappedSetClubMessages);
  
  // Debug effect to log when clubMessages changes
  useEffect(() => {
    console.log('[useClubMessages] Club messages updated:', 
      Object.keys(clubMessages).map(clubId => `${clubId}: ${clubMessages[clubId]?.length || 0} messages`));
  }, [clubMessages]);
  
  return {
    clubMessages,
    setClubMessages: wrappedSetClubMessages
  };
};
