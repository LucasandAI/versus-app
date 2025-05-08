import { useState, useEffect } from 'react';
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
  
  // Keep local state in sync with global messages
  useEffect(() => {
    if (globalMessages[clubId]) {
      setMessages(globalMessages[clubId]);
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
            .order('timestamp', { ascending: true })
            .limit(50);

          if (data) {
            setMessages(data);
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
