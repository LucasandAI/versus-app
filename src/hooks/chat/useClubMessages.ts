import { useState, useEffect, useRef, useCallback } from 'react';
import { Club } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { useApp } from '@/context/AppContext';
import { useClubMessageSubscriptions } from '@/hooks/chat/messages/useClubMessageSubscriptions';

export const useClubMessages = (userClubs: Club[], isOpen: boolean) => {
  const [clubMessages, setClubMessages] = useState<Record<string, any[]>>({});
  const { currentUser } = useApp();
  const activeSubscriptionsRef = useRef<Record<string, boolean>>({});
  const messageUpdateQueue = useRef<Record<string, any[]>>({});
  const updateTimeout = useRef<NodeJS.Timeout | null>(null);
  
  // Process message updates in batches
  const processMessageUpdates = useCallback(() => {
    if (updateTimeout.current) {
      clearTimeout(updateTimeout.current);
    }

    updateTimeout.current = setTimeout(() => {
      setClubMessages(prev => {
        const updated = { ...prev };
        Object.entries(messageUpdateQueue.current).forEach(([clubId, messages]) => {
          updated[clubId] = [...(updated[clubId] || []), ...messages].sort(
            (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
          );
        });
        messageUpdateQueue.current = {};
        return updated;
      });

      // Dispatch event for UI updates
      window.dispatchEvent(new CustomEvent('clubMessagesUpdated'));
    }, 100);
  }, []);

  // Add message with optimistic update
  const addMessage = useCallback((clubId: string, message: any, isOptimistic = false) => {
    if (!messageUpdateQueue.current[clubId]) {
      messageUpdateQueue.current[clubId] = [];
    }
    messageUpdateQueue.current[clubId].push({
      ...message,
      optimistic: isOptimistic
    });
    processMessageUpdates();
  }, [processMessageUpdates]);

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
          
          setClubMessages(messagesMap);
        }
      } catch (error) {
        console.error('[useClubMessages] Error fetching initial messages:', error);
      }
    };
    
    fetchInitialMessages();
  }, [isOpen, currentUser?.id, userClubs]);
  
  // Set up real-time subscriptions
  useEffect(() => {
    if (!isOpen || !currentUser?.id || !userClubs.length) return;

    const channel = supabase
      .channel('club-messages-updates')
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'club_chat_messages',
          filter: `club_id=in.(${userClubs.map(club => `'${club.id}'`).join(',')})`
        },
        (payload) => {
          if (payload.new.sender_id !== currentUser.id) {
            addMessage(payload.new.club_id, payload.new);
          }
        }
      )
      .on('postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'club_chat_messages',
          filter: `club_id=in.(${userClubs.map(club => `'${club.id}'`).join(',')})`
        },
        (payload) => {
          if (payload.old) {
            setClubMessages(prev => {
              const updated = { ...prev };
              if (updated[payload.old.club_id]) {
                updated[payload.old.club_id] = updated[payload.old.club_id].filter(
                  msg => msg.id !== payload.old.id
                );
              }
              return updated;
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      if (updateTimeout.current) {
        clearTimeout(updateTimeout.current);
      }
    };
  }, [isOpen, currentUser?.id, userClubs, addMessage]);
  
  return {
    clubMessages,
    addMessage,
    setClubMessages
  };
};
