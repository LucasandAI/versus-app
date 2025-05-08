
import { useState, useEffect, useCallback } from 'react';
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
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch initial messages
  useEffect(() => {
    const fetchMessages = async () => {
      // Don't fetch for new conversations
      if (conversationId === 'new' || !conversationId || !userId || !currentUserId) {
        setMessages([]);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        console.log(`[useActiveDMMessages] Fetching messages for conversation: ${conversationId}`);

        const { data, error } = await supabase
          .from('direct_messages')
          .select('*')
          .eq('conversation_id', conversationId)
          .order('timestamp', { ascending: true });

        if (error) throw error;

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

      } catch (err: any) {
        console.error('[useActiveDMMessages] Error fetching messages:', err);
        setError(err.message || 'Failed to load messages');
      } finally {
        setIsLoading(false);
      }
    };

    fetchMessages();
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
    error
  };
};
