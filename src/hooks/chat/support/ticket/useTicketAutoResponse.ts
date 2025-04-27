
import { supabase } from '@/integrations/supabase/client';

export const useTicketAutoResponse = () => {
  const sendAutoResponse = async (ticketId: string) => {
    const { error } = await supabase
      .from('support_messages')
      .insert({
        ticket_id: ticketId,
        text: `Thank you for contacting support. A support agent will review your request and respond shortly.`,
        is_support: true
      });

    if (error) {
      console.error('[useTicketAutoResponse] Error sending auto-response:', error);
      throw error;
    }
  };

  return {
    sendAutoResponse
  };
};
