
import { useState, useEffect, useRef } from 'react';
import { Club } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { useApp } from '@/context/AppContext';
import { useClubMessageSubscriptions } from '@/hooks/chat/messages/useClubMessageSubscriptions';

export const useClubMessages = (userClubs: Club[], isOpen: boolean) => {
  const [clubMessages, setClubMessages] = useState<Record<string, any[]>>({});
  const [isLoading, setIsLoading] = useState<Record<string, boolean>>({});
  const [hasMore, setHasMore] = useState<Record<string, boolean>>({});
  const { currentUser } = useApp();
  const activeSubscriptionsRef = useRef<Record<string, boolean>>({});
  
  // Fetch initial messages when drawer opens
  useEffect(() => {
    if (!isOpen || !currentUser?.id || !userClubs.length) return;
    
    const fetchInitialMessages = async () => {
      try {
        // Get last 50 messages for each club
        const clubIds = userClubs.map(club => club.id);
        
        // Set loading state for all clubs
        const loadingState: Record<string, boolean> = {};
        clubIds.forEach(id => {
          loadingState[id] = true;
        });
        setIsLoading(loadingState);
        
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
          const hasMoreMap: Record<string, boolean> = {};
          
          // Group messages by club_id
          data.forEach(message => {
            if (!messagesMap[message.club_id]) {
              messagesMap[message.club_id] = [];
              // If we got exactly 50 messages, assume there might be more
              hasMoreMap[message.club_id] = true;
            }
            messagesMap[message.club_id].push(message);
          });
          
          // Sort messages by timestamp (oldest first) for each club
          Object.keys(messagesMap).forEach(clubId => {
            // We fetched in descending order, so when we reverse we'll have oldest first
            messagesMap[clubId] = messagesMap[clubId].sort(
              (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
            );
          });
          
          setClubMessages(messagesMap);
          setHasMore(hasMoreMap);
        }
        
        // Clear loading states
        const notLoadingState: Record<string, boolean> = {};
        clubIds.forEach(id => {
          notLoadingState[id] = false;
        });
        setIsLoading(notLoadingState);
      } catch (error) {
        console.error('[useClubMessages] Error fetching initial messages:', error);
        // Clear loading states on error
        const notLoadingState: Record<string, boolean> = {};
        userClubs.forEach(club => {
          notLoadingState[club.id] = false;
        });
        setIsLoading(notLoadingState);
      }
    };
    
    fetchInitialMessages();
  }, [isOpen, currentUser?.id, userClubs]);
  
  // Set up real-time subscription for messages
  useClubMessageSubscriptions(userClubs, isOpen, activeSubscriptionsRef, setClubMessages);
  
  // Function to load older messages for a specific club
  const loadOlderMessages = async (clubId: string) => {
    if (!currentUser?.id || !clubId || !clubMessages[clubId]?.length) return;
    
    try {
      setIsLoading(prev => ({ ...prev, [clubId]: true }));
      
      // Get the timestamp of the oldest message we have
      const oldestMessage = [...clubMessages[clubId]].sort(
        (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      )[0];
      
      if (!oldestMessage) {
        setHasMore(prev => ({ ...prev, [clubId]: false }));
        setIsLoading(prev => ({ ...prev, [clubId]: false }));
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
        .eq('club_id', clubId)
        .lt('timestamp', oldestMessage.timestamp) // Get messages older than our oldest
        .order('timestamp', { ascending: false })
        .limit(50);
        
      if (error) throw error;
      
      if (data && data.length > 0) {
        // Sort the newly fetched messages (oldest first)
        const olderMessages = data.sort(
          (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        );
        
        // Add older messages to the beginning of the current messages array
        setClubMessages(prev => ({
          ...prev,
          [clubId]: [...olderMessages, ...prev[clubId]]
        }));
        
        // If we got less than 50 messages, assume there are no more
        setHasMore(prev => ({ ...prev, [clubId]: data.length === 50 }));
      } else {
        // No older messages found
        setHasMore(prev => ({ ...prev, [clubId]: false }));
      }
    } catch (error) {
      console.error('[useClubMessages] Error fetching older messages:', error);
    } finally {
      setIsLoading(prev => ({ ...prev, [clubId]: false }));
    }
  };
  
  return {
    clubMessages,
    setClubMessages,
    isLoading,
    hasMore,
    loadOlderMessages
  };
};
