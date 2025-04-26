
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
  // More robust type checking using type guard
  if (!payload.new || typeof payload.new !== 'object') {
    console.error('[messageHandlerUtils] Invalid payload format:', payload);
    return;
  }

  // Ensure required properties exist using type guard
  const newMessage = payload.new as { 
    sender_id?: string; 
    club_id?: string; 
    id?: string;
    message?: string;
    timestamp?: string;
  };

  if (!newMessage.sender_id || !newMessage.club_id || !newMessage.id) {
    console.error('[messageHandlerUtils] Missing required message properties:', newMessage);
    return;
  }

  const sender = await fetchMessageSender(newMessage.sender_id);
  if (!sender) return;

  const completeMessage = {
    ...newMessage,
    sender
  };

  setClubMessages(currentMessages => {
    const clubId = newMessage.club_id;
    const existingMessages = currentMessages[clubId] || [];

    // Prevent duplicate messages
    if (existingMessages.some(msg => msg.id === newMessage.id)) {
      return currentMessages;
    }

    return {
      ...currentMessages,
      [clubId]: [...existingMessages, completeMessage]
    };
  });
};
