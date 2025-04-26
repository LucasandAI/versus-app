
import { supabase } from '@/integrations/supabase/client';
import { RealtimePostgresChangesPayload } from '@supabase/supabase-js';

export const fetchMessageSender = async (senderId: string) => {
  try {
    const { data: sender } = await supabase
      .from('users')
      .select('id, name, avatar')
      .eq('id', senderId)
      .single();

    if (!sender) {
      console.error('[messageHandlerUtils] Error fetching sender');
      return null;
    }

    return sender;
  } catch (error) {
    console.error('[messageHandlerUtils] Error fetching sender:', error);
    return null;
  }
};

export const processNewMessage = async (
  payload: RealtimePostgresChangesPayload<{
    [key: string]: any;
  }>,
  setClubMessages: React.Dispatch<React.SetStateAction<Record<string, any[]>>>
) => {
  const sender = await fetchMessageSender(payload.new.sender_id);
  if (!sender) return;

  const completeMessage = {
    ...payload.new,
    sender
  };

  setClubMessages(currentMessages => {
    const clubId = payload.new.club_id;
    const existingMessages = currentMessages[clubId] || [];

    if (existingMessages.some(msg => msg.id === payload.new.id)) {
      return currentMessages;
    }

    return {
      ...currentMessages,
      [clubId]: [...existingMessages, completeMessage]
    };
  });
};
