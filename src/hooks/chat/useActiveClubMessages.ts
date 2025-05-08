
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

/**
 * Hook for managing active club messages that syncs with global message state
 */
export const useActiveClubMessages = (
  clubId: string,
  globalMessages: Record<string, any[]> = {}
) => {
  // Use the global messages as the source of truth
  const [messages, setMessages] = useState<any[]>(globalMessages[clubId] || []);
  // Track initial load to prevent unnecessary fetch
  const initialLoadCompletedRef = useRef<boolean>(false);
  // Track currently active club to prevent cross-chat interference
  const activeClubRef = useRef<string>(clubId);
  
  // Keep local state in sync with global messages
  useEffect(() => {
    if (globalMessages[clubId]) {
      // Don't update if it's the same messages (by reference)
      if (messages !== globalMessages[clubId]) {
        setMessages(globalMessages[clubId]);
        console.log(`[useActiveClubMessages] Synced with global state for club ${clubId}, messages: ${globalMessages[clubId].length}`);
      }
    }
    
    // Update active club reference
    if (activeClubRef.current !== clubId) {
      activeClubRef.current = clubId;
      initialLoadCompletedRef.current = false;
      console.log(`[useActiveClubMessages] Club changed to ${clubId}, resetting state`);
    }
  }, [clubId, globalMessages, messages]);

  // Listen for club message events with better isolation
  useEffect(() => {
    const currentClubId = clubId; // Capture current value for closure
    
    const handleClubMessageReceived = (e: CustomEvent) => {
      // Only process events for the active club
      if (e.detail.clubId === currentClubId && e.detail.message) {
        setMessages(prev => {
          // Check if message already exists
          const exists = prev.some(msg => msg.id === e.detail.message.id);
          if (exists) return prev;

          // Add the new message and sort by timestamp
          const updatedMessages = [...prev, e.detail.message].sort(
            (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
          );
          
          console.log(`[useActiveClubMessages] Message received for club ${currentClubId}, new count: ${updatedMessages.length}`);
          return updatedMessages;
        });
      }
    };

    const handleClubMessageDeleted = (e: CustomEvent) => {
      // Only process events for the active club
      if (e.detail.clubId === currentClubId) {
        setMessages(prev => {
          const filtered = prev.filter(msg => msg.id !== e.detail.messageId);
          console.log(`[useActiveClubMessages] Message deleted for club ${currentClubId}, new count: ${filtered.length}`);
          return filtered;
        });
      }
    };

    // Add event listeners
    window.addEventListener('clubMessageReceived', handleClubMessageReceived as EventListener);
    window.addEventListener('clubMessageDeleted', handleClubMessageDeleted as EventListener);

    return () => {
      window.removeEventListener('clubMessageReceived', handleClubMessageReceived as EventListener);
      window.removeEventListener('clubMessageDeleted', handleClubMessageDeleted as EventListener);
    };
  }, [clubId]);

  // Load initial messages for the club if not in global state
  useEffect(() => {
    // Only fetch if:
    // 1. We don't have messages for this club yet
    // 2. Initial load hasn't been completed
    if ((!globalMessages[clubId]?.length || globalMessages[clubId].length === 0) && 
        !initialLoadCompletedRef.current) {
      
      const fetchMessages = async () => {
        try {
          console.log(`[useActiveClubMessages] Fetching messages for club ${clubId}`);
          initialLoadCompletedRef.current = true;
          
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
            .order('timestamp', { ascending: true })
            .limit(50);

          if (data) {
            console.log(`[useActiveClubMessages] Fetched ${data.length} messages for club ${clubId}`);
            // Only set messages if the club hasn't changed during fetch
            if (activeClubRef.current === clubId) {
              setMessages(data);
            }
          }
        } catch (error) {
          console.error('[useActiveClubMessages] Error fetching club messages:', error);
        }
      };

      fetchMessages();
    }
  }, [clubId, globalMessages]);

  return { messages };
};
