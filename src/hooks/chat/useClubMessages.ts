
import { useState, useEffect, useRef } from 'react';
import { Club } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { useApp } from '@/context/AppContext';
import { useClubMessageSubscriptions } from '@/hooks/chat/messages/useClubMessageSubscriptions';

export const useClubMessages = (userClubs: Club[], isOpen: boolean) => {
  const [clubMessages, setClubMessages] = useState<Record<string, any[]>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { currentUser } = useApp();
  const activeSubscriptionsRef = useRef<Record<string, boolean>>({});
  const hasLoadedRef = useRef<Record<string, boolean>>({});
  
  // Fetch initial messages when drawer opens
  useEffect(() => {
    if (!isOpen || !currentUser?.id || !userClubs.length) {
      setIsLoading(false);
      return;
    }
    
    const fetchInitialMessages = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Get last 50 messages for each club
        const clubIds = userClubs.map(club => club.id);
        const unfetchedClubIds = clubIds.filter(id => !hasLoadedRef.current[id]);
        
        // Skip fetch if we've already loaded messages for all clubs
        if (unfetchedClubIds.length === 0) {
          console.log('[useClubMessages] All club messages already loaded');
          setIsLoading(false);
          return;
        }
        
        console.log('[useClubMessages] Fetching messages for clubs:', unfetchedClubIds);
        
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
          .in('club_id', unfetchedClubIds)
          .order('timestamp', { ascending: false })
          .limit(50);
          
        if (error) throw error;
        
        if (data) {
          const messagesMap: Record<string, any[]> = { ...clubMessages };
          
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
          
          // Mark fetched clubs as loaded
          unfetchedClubIds.forEach(clubId => {
            hasLoadedRef.current[clubId] = true;
          });
          
          setClubMessages(messagesMap);
        }
      } catch (error) {
        console.error('[useClubMessages] Error fetching initial messages:', error);
        setError('Failed to load club messages');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchInitialMessages();
  }, [isOpen, currentUser?.id, userClubs]);
  
  // Set up real-time subscription for messages
  useClubMessageSubscriptions(userClubs, isOpen, activeSubscriptionsRef, setClubMessages);
  
  // Reset loaded state when drawer closes
  useEffect(() => {
    if (!isOpen) {
      hasLoadedRef.current = {};
    }
  }, [isOpen]);
  
  return {
    clubMessages,
    setClubMessages,
    isLoading,
    error
  };
};
