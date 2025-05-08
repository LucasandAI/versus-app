
import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ChatMessage } from '@/types/chat';

interface UserData {
  id: string;
  name: string;
  avatar?: string;
}

export const useActiveDMMessages = (
  conversationId: string,
  userId?: string,
  currentUserId?: string,
  userData?: UserData
) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false); // Start as false to avoid showing loading unnecessarily
  const [error, setError] = useState<string | null>(null);
  const [isFetched, setIsFetched] = useState(false);
  const [fetchAttempted, setFetchAttempted] = useState(false);
  const isFetchingRef = useRef(false);

  // Fetch initial messages
  useEffect(() => {
    // Reset state when conversation changes
    setError(null);
    setIsFetched(false);
    setFetchAttempted(false);
    
    // Don't reset messages immediately to prevent flashing
    // We'll update them once new data is fetched
    
    let isMounted = true;
    
    const fetchMessages = async () => {
      // Don't fetch for new conversations or if already fetching
      if (conversationId === 'new' || !conversationId || !userId || !currentUserId || isFetchingRef.current) {
        if (isMounted) {
          if (conversationId === 'new') {
            setMessages([]);
          }
          setIsLoading(false);
          setFetchAttempted(true);
        }
        return;
      }

      // Set loading and fetching flags
      if (!isFetched) {
        setIsLoading(true);
      }
      isFetchingRef.current = true;

      try {
        console.log(`[useActiveDMMessages] Fetching messages for conversation: ${conversationId}`);

        const { data, error } = await supabase
          .from('direct_messages')
          .select('*')
          .eq('conversation_id', conversationId)
          .order('timestamp', { ascending: true });

        if (error) throw error;

        // Only update state if component is still mounted
        if (isMounted) {
          const formattedMessages: ChatMessage[] = (data || []).map((msg) => ({
            id: msg.id,
            text: msg.text,
            sender: {
              id: msg.sender_id,
              name: msg.sender_id === currentUserId 
                ? 'You' 
                : (userData?.name || 'User'),
              avatar: msg.sender_id === currentUserId 
                ? undefined 
                : userData?.avatar
            },
            timestamp: msg.timestamp
          }));

          setMessages(formattedMessages);
          setFetchAttempted(true);
          setIsFetched(true);
        }

      } catch (err: any) {
        console.error('[useActiveDMMessages] Error fetching messages:', err);
        if (isMounted) {
          setError(err.message || 'Failed to load messages');
          setFetchAttempted(true);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
          isFetchingRef.current = false;
        }
      }
    };

    fetchMessages();
    
    return () => {
      isMounted = false;
    };
  }, [conversationId, userId, currentUserId, userData]);

  // Add optimistic message helper
  const addOptimisticMessage = useCallback((message: ChatMessage) => {
    setMessages(prev => [...prev, message]);
  }, []);

  return { 
    messages, 
    setMessages, 
    addOptimisticMessage,
    isLoading,
    error,
    isFetched,
    fetchAttempted
  };
};
