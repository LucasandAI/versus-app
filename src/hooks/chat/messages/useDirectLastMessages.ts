import React from 'react';
import { supabase } from '@/integrations/supabase/client';

export function useDirectLastMessages(conversationIds: string[]) {
  const [lastMessages, setLastMessages] = React.useState<Record<string, { text: string; timestamp: string }>>({});
  const processedIds = React.useRef(new Set<string>());

  React.useEffect(() => {
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
        async (payload) => {
          const msg = payload.new;
          if (!msg || !conversationIds.includes(msg.conversation_id)) return;

          // Skip if we've already processed this message
          const msgId = msg.id?.toString();
          if (msgId && processedIds.current.has(msgId)) {
            console.log('[useDirectLastMessages] Skipping duplicate message:', msgId);
            return;
          }

          if (msgId) {
            processedIds.current.add(msgId);
          }

          // Update the last message for this conversation
          setLastMessages(prev => ({
            ...prev,
            [msg.conversation_id]: {
              text: msg.text,
              timestamp: msg.timestamp
            }
          }));

          // Force a refetch to ensure we have the latest data
          fetchLastMessages();
        }
      )
      .subscribe();

    return () => {
      isMounted = false;
      channel.unsubscribe();
      processedIds.current.clear();
    };
  }, [JSON.stringify(conversationIds)]);

  return lastMessages;
} 