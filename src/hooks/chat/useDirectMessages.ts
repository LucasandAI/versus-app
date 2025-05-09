import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useApp } from '@/context/AppContext';

export const useDirectMessages = (conversationId: string | null) => {
  const [messages, setMessages] = useState<any[]>([]);
  const { currentUser } = useApp();

  // Fetch initial messages
  useEffect(() => {
    if (!conversationId || !currentUser?.id) return;

    const fetchMessages = async () => {
      try {
        const { data, error } = await supabase
          .from('direct_messages')
          .select(`
            id,
            text,
            sender_id,
            conversation_id,
            created_at,
            sender:sender_id (
              id,
              name,
              avatar
            )
          `)
          .eq('conversation_id', conversationId)
          .order('created_at', { ascending: true })
          .limit(50);

        if (error) throw error;

        if (data) {
          setMessages(data);
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
          setMessages(prev => [...prev, payload.new]);
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