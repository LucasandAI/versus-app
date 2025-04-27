
import { supabase } from '@/integrations/supabase/client';

export const useTicketInitialMessage = () => {
  const sendInitialMessage = async (ticketId: string, message: string) => {
    const { error } = await supabase
      .from('support_messages')
      .insert({
        ticket_id: ticketId,
        text: message,
        is_support: false
      });

    if (error) {
      console.error('[useTicketInitialMessage] Error sending initial message:', error);
      throw error;
    }
  };

  return {
    sendInitialMessage
  };
};
