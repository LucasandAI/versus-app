import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

const MESSAGES_PER_PAGE = 50;

export const useDirectMessages = (
  conversationId: string,
  globalMessages: Record<string, any[]> = {}
) => {
  const [messages, setMessages] = useState<any[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [oldestMessageTimestamp, setOldestMessageTimestamp] = useState<string | null>(null);
  
  // Keep local state in sync with global messages
  useEffect(() => {
    if (globalMessages[conversationId]) {
      const sortedMessages = [...globalMessages[conversationId]].sort((a, b) => 
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );
      setMessages(sortedMessages);
      
      // Update oldest message timestamp
      if (sortedMessages.length > 0) {
        setOldestMessageTimestamp(sortedMessages[0].timestamp);
      }
    }
  }, [conversationId, globalMessages]);

  // Load initial messages if not in global state
  useEffect(() => {
    if (!globalMessages[conversationId]?.length) {
      const fetchMessages = async () => {
        try {
          const { data } = await supabase
            .from('direct_messages')
            .select(`
              id, 
              message, 
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
            .order('timestamp', { ascending: true })
            .limit(MESSAGES_PER_PAGE);

          if (data) {
            setMessages(data);
            
            // Update oldest message timestamp
            if (data.length > 0) {
              setOldestMessageTimestamp(data[0].timestamp);
            }
            
            // Check if there are more messages
            setHasMore(data.length === MESSAGES_PER_PAGE);
          }
        } catch (error) {
          console.error('[useDirectMessages] Error fetching messages:', error);
        }
      };

      fetchMessages();
    }
  }, [conversationId, globalMessages]);

  // Function to load more messages
  const loadMoreMessages = useCallback(async () => {
    if (!hasMore || isLoadingMore || !oldestMessageTimestamp) return;
    
    setIsLoadingMore(true);
    try {
      const { data } = await supabase
        .from('direct_messages')
        .select(`
          id, 
          message, 
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
        .lt('timestamp', oldestMessageTimestamp)
        .order('timestamp', { ascending: true })
        .limit(MESSAGES_PER_PAGE);

      if (data) {
        setMessages(prev => [...data, ...prev]);
        
        // Update oldest message timestamp
        if (data.length > 0) {
          setOldestMessageTimestamp(data[0].timestamp);
        }
        
        // Check if there are more messages
        setHasMore(data.length === MESSAGES_PER_PAGE);
      }
    } catch (error) {
      console.error('[useDirectMessages] Error loading more messages:', error);
    } finally {
      setIsLoadingMore(false);
    }
  }, [conversationId, hasMore, isLoadingMore, oldestMessageTimestamp]);

  return { 
    messages, 
    hasMore, 
    isLoadingMore, 
    loadMoreMessages 
  };
}; 