
import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ChatMessage } from '@/types/chat';

const PAGE_SIZE = 30; // Number of messages per page

export const usePaginatedMessages = (conversationId: string, conversationType: 'club' | 'dm') => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const lastCursorRef = useRef<string | null>(null);
  const initialLoadDoneRef = useRef(false);

  // Function to load more messages
  const loadMoreMessages = useCallback(async (isInitialLoad = false) => {
    if ((!hasMore && !isInitialLoad) || isLoading || !conversationId || conversationId === 'new') return;

    setIsLoading(true);
    try {
      let query;
      
      if (conversationType === 'club') {
        query = supabase
          .from('club_chat_messages')
          .select(`
            id, 
            message as text, 
            sender_id, 
            club_id, 
            timestamp,
            sender:sender_id (
              id, 
              name, 
              avatar
            )
          `)
          .eq('club_id', conversationId)
          .order('timestamp', { ascending: false })
          .limit(PAGE_SIZE);
      } else {
        query = supabase
          .from('direct_messages')
          .select(`
            id, 
            text, 
            sender_id, 
            receiver_id, 
            conversation_id,
            timestamp,
            sender:sender_id (
              id, 
              name, 
              avatar
            )
          `)
          .eq('conversation_id', conversationId)
          .order('timestamp', { ascending: false })
          .limit(PAGE_SIZE);
      }

      // Apply cursor for pagination if not the initial load
      if (lastCursorRef.current && !isInitialLoad) {
        query = query.lt('timestamp', lastCursorRef.current);
      }

      const { data, error } = await query;
      
      if (error) throw error;
      
      if (data) {
        // Format messages to match ChatMessage type
        const formattedMessages = data.map(msg => {
          // Set the last cursor to the timestamp of the last message
          if (msg.timestamp) {
            lastCursorRef.current = msg.timestamp;
          }
          
          return {
            id: msg.id,
            text: msg.text || msg.message,
            sender: msg.sender || {
              id: msg.sender_id,
              name: 'Unknown',
              avatar: undefined
            },
            timestamp: msg.timestamp
          };
        });

        // Update hasMore based on whether we got less messages than PAGE_SIZE
        setHasMore(formattedMessages.length === PAGE_SIZE);

        // Add new messages to the state (oldest first)
        setMessages(prev => {
          if (isInitialLoad) {
            return formattedMessages.reverse();
          }
          return [...prev, ...formattedMessages.reverse()];
        });
        
        initialLoadDoneRef.current = true;
      } else {
        setHasMore(false);
      }
    } catch (error) {
      console.error('[usePaginatedMessages] Error fetching messages:', error);
    } finally {
      setIsLoading(false);
    }
  }, [conversationId, conversationType, hasMore, isLoading]);

  // Initial load of messages
  useEffect(() => {
    if (conversationId && conversationId !== 'new') {
      initialLoadDoneRef.current = false;
      lastCursorRef.current = null;
      setMessages([]);
      setHasMore(true);
      loadMoreMessages(true);
    }
  }, [conversationId, conversationType, loadMoreMessages]);

  return {
    messages,
    isLoading,
    hasMore,
    loadMoreMessages
  };
};
