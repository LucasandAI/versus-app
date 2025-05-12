import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export function useDirectLastMessages(conversationIds: string[]) {
  const [lastMessages, setLastMessages] = useState<Record<string, { text: string; timestamp: string }>>({});

  useEffect(() => {
    if (!conversationIds.length) {
      setLastMessages({});
      return;
    }

    let isMounted = true;

    const fetchLastMessages = async () => {
      const { data, error } = await supabase
        .from('direct_messages')
        .select('conversation_id, text, timestamp')
        .in('conversation_id', conversationIds)
        .order('timestamp', { ascending: false });

      if (error || !isMounted) {
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

    // Real-time subscription for all direct message changes
    const channel = supabase
      .channel('realtime-direct-messages')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'direct_messages',
        },
        (payload) => {
          const msg = payload.new;
          if (conversationIds.includes(msg.conversation_id)) {
            fetchLastMessages();
          }
        }
      )
      .subscribe();

    return () => {
      isMounted = false;
      channel.unsubscribe();
    };
  }, [JSON.stringify(conversationIds)]);

  return lastMessages;
} 