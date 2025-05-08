import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

const MESSAGES_PER_PAGE = 50;

/**
 * Hook for managing active club messages that syncs with global message state
 */
export const useActiveClubMessages = (
  clubId: string,
  globalMessages: Record<string, any[]> = {}
) => {
  // Use the global messages as the source of truth
  const [messages, setMessages] = useState<any[]>(globalMessages[clubId] || []);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [oldestMessageTimestamp, setOldestMessageTimestamp] = useState<string | null>(null);
  
  // Keep local state in sync with global messages
  useEffect(() => {
    if (globalMessages[clubId]) {
      setMessages(globalMessages[clubId]);
      // Update oldest message timestamp
      if (globalMessages[clubId].length > 0) {
        const oldestMsg = globalMessages[clubId].reduce((oldest, current) => 
          new Date(current.timestamp) < new Date(oldest.timestamp) ? current : oldest
        );
        setOldestMessageTimestamp(oldestMsg.timestamp);
      }
    }
  }, [clubId, globalMessages]);

  // Listen for club message events
  useEffect(() => {
    const handleClubMessageReceived = (e: CustomEvent) => {
      if (e.detail.clubId === clubId && e.detail.message) {
        setMessages(prev => {
          // Check if message already exists
          const exists = prev.some(msg => msg.id === e.detail.message.id);
          if (exists) return prev;

          // Add the new message and sort by timestamp
          return [...prev, e.detail.message].sort(
            (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
          );
        });
      }
    };

    const handleClubMessageDeleted = (e: CustomEvent) => {
      if (e.detail.clubId === clubId) {
        setMessages(prev => 
          prev.filter(msg => msg.id !== e.detail.messageId)
        );
      }
    };

    window.addEventListener('clubMessageReceived', handleClubMessageReceived as EventListener);
    window.addEventListener('clubMessageDeleted', handleClubMessageDeleted as EventListener);

    return () => {
      window.removeEventListener('clubMessageReceived', handleClubMessageReceived as EventListener);
      window.removeEventListener('clubMessageDeleted', handleClubMessageDeleted as EventListener);
    };
  }, [clubId]);

  // Load initial messages for the club if not in global state
  useEffect(() => {
    // Only fetch if we don't have messages for this club yet
    if (!globalMessages[clubId]?.length) {
      const fetchMessages = async () => {
        try {
          const { data } = await supabase
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
            .order('timestamp', { ascending: false })
            .limit(MESSAGES_PER_PAGE);

          if (data) {
            // Reverse the order to show oldest first
            const sortedData = [...data].reverse();
            setMessages(sortedData);
            
            // Update oldest message timestamp
            if (sortedData.length > 0) {
              setOldestMessageTimestamp(sortedData[0].timestamp);
            }
            
            // Check if there are more messages
            setHasMore(data.length === MESSAGES_PER_PAGE);
          }
        } catch (error) {
          console.error('[useActiveClubMessages] Error fetching club messages:', error);
        }
      };

      fetchMessages();
    }
  }, [clubId, globalMessages]);

  // Function to load more messages
  const loadMoreMessages = useCallback(async () => {
    if (!hasMore || isLoadingMore || !oldestMessageTimestamp) return;
    
    setIsLoadingMore(true);
    try {
      const { data } = await supabase
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
        .lt('timestamp', oldestMessageTimestamp)
        .order('timestamp', { ascending: false })
        .limit(MESSAGES_PER_PAGE);

      if (data) {
        // Reverse the order to show oldest first
        const sortedData = [...data].reverse();
        
        // Update messages by prepending older messages
        setMessages(prev => {
          // Combine old and new messages, ensuring no duplicates
          const combinedMessages = [...sortedData, ...prev];
          const uniqueMessages = Array.from(
            new Map(combinedMessages.map(msg => [msg.id, msg])).values()
          );
          
          // Sort by timestamp to ensure correct order
          return uniqueMessages.sort(
            (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
          );
        });
        
        // Update oldest message timestamp
        if (sortedData.length > 0) {
          setOldestMessageTimestamp(sortedData[0].timestamp);
        }
        
        // Check if there are more messages
        setHasMore(data.length === MESSAGES_PER_PAGE);
      }
    } catch (error) {
      console.error('[useActiveClubMessages] Error loading more messages:', error);
    } finally {
      setIsLoadingMore(false);
    }
  }, [clubId, hasMore, isLoadingMore, oldestMessageTimestamp]);

  return { 
    messages, 
    hasMore, 
    isLoadingMore, 
    loadMoreMessages 
  };
};
