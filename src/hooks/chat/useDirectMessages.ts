import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useApp } from '@/context/AppContext';
import { ChatMessage } from '@/types/chat';

export const useDirectMessages = (conversationId: string | null) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const { currentUser } = useApp();

  // Fetch initial messages
  useEffect(() => {
    if (!conversationId || !currentUser?.id) return;

    const fetchMessages = async () => {
      try {
        console.log('[useDirectMessages] Fetching messages for conversation:', conversationId);
        
        const { data, error } = await supabase
          .from('direct_messages')
          .select(`
            id,
            text,
            sender_id,
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
          .limit(50);

        if (error) throw error;

        if (data) {
          // Normalize messages
          const normalizedMessages = data.map(message => ({
            id: message.id,
            text: message.text,
            timestamp: message.timestamp,
            sender: message.sender || {
              id: message.sender_id,
              name: 'Unknown User',
              avatar: null
            },
            isUserMessage: String(message.sender_id) === String(currentUser.id)
          }));
          
          console.log('[useDirectMessages] Normalized messages:', normalizedMessages);
          setMessages(normalizedMessages);
        }
      } catch (error) {
        console.error('[useDirectMessages] Error fetching messages:', error);
      }
    };

    fetchMessages();

    // Set up real-time subscription
    const subscription = supabase
      .channel(`direct_messages:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'direct_messages',
          filter: `conversation_id=eq.${conversationId}`
        },
        (payload) => {
          const newMessage = payload.new;
          const normalizedMessage = {
            id: newMessage.id,
            text: newMessage.text,
            timestamp: newMessage.timestamp,
            sender: newMessage.sender || {
              id: newMessage.sender_id,
              name: 'Unknown User',
              avatar: null
            },
            isUserMessage: String(newMessage.sender_id) === String(currentUser.id)
          };
          setMessages(prev => [...prev, normalizedMessage]);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'direct_messages',
          filter: `conversation_id=eq.${conversationId}`
        },
        (payload) => {
          setMessages(prev => prev.filter(msg => msg.id !== payload.old.id));
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [conversationId, currentUser?.id]);

  return { messages };
}; 