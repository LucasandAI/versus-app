import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export function useDirectLastMessages(conversationIds: string[]) {
  const [lastMessages, setLastMessages] = useState<Record<string, { text: string; timestamp: string }>>({});

  useEffect(() => {
    if (!conversationIds.length) {
      setLastMessages({});
      return;
    }

    const fetchLastMessages = async () => {
      const { data, error } = await supabase
        .from('direct_messages')
        .select('conversation_id, text, timestamp')
        .in('conversation_id', conversationIds)
        .order('timestamp', { ascending: false });

      if (error) {
        setLastMessages({});
        return;
      }

      const map: Record<string, { text: string; timestamp: string }> = {};
      for (const msg of data) {
        if (!map[msg.conversation_id]) {
          map[msg.conversation_id] = { text: msg.text, timestamp: msg.timestamp };
        }
      }
      setLastMessages(map);
    };

    fetchLastMessages();

    // Real-time subscription for new direct messages
    const channel = supabase
      .channel('realtime-direct-messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'direct_messages',
        },
        (payload) => {
          const msg = payload.new;
          if (conversationIds.includes(msg.conversation_id)) {
            setLastMessages((prev) => {
              // Only update if the new message is newer
              const prevMsg = prev[msg.conversation_id];
              if (!prevMsg || new Date(msg.timestamp) > new Date(prevMsg.timestamp)) {
                return {
                  ...prev,
                  [msg.conversation_id]: { text: msg.text, timestamp: msg.timestamp },
                };
              }
              return prev;
            });
          }
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [conversationIds.join(',')]);

  return lastMessages;
} 