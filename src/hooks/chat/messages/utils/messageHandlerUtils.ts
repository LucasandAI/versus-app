
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
  // Check if payload.new exists and has the required properties
  if (!payload.new || typeof payload.new !== 'object' || !('sender_id' in payload.new)) {
    console.error('[messageHandlerUtils] Invalid payload format:', payload);
    return;
  }

  const sender = await fetchMessageSender(payload.new.sender_id);
  if (!sender) return;

  const completeMessage = {
    ...payload.new,
    sender
  };

  setClubMessages(currentMessages => {
    // Ensure club_id exists in the payload
    if (!('club_id' in payload.new) || !payload.new.club_id) {
      console.error('[messageHandlerUtils] Missing club_id in payload:', payload);
      return currentMessages;
    }

    const clubId = payload.new.club_id;
    const existingMessages = currentMessages[clubId] || [];

    // Ensure id exists in the payload
    if (!('id' in payload.new) || !payload.new.id) {
      console.error('[messageHandlerUtils] Missing message id in payload:', payload);
      return currentMessages;
    }

    if (existingMessages.some(msg => msg.id === payload.new.id)) {
      return currentMessages;
    }

    return {
      ...currentMessages,
      [clubId]: [...existingMessages, completeMessage]
    };
  });
};
