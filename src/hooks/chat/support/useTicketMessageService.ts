
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export const useTicketMessageService = () => {
  const sendMessageToTicket = async (ticketId: string, message: string) => {
    try {
      console.log('[useTicketMessageService] Sending message to ticket:', ticketId);
      
      // Send message to Supabase
      const { data, error } = await supabase
        .from('support_messages')
        .insert({
          ticket_id: ticketId,
          text: message,
          is_support: false
        })
        .select()
        .single();
        
      if (error) {
        console.error('[useTicketMessageService] Error sending message:', error);
        throw error;
      }
      
      // Dispatch events for UI updates
      window.dispatchEvent(new Event('ticketUpdated'));
      
      return true;
    } catch (error) {
      console.error('[useTicketMessageService] Error:', error);
      toast({
        title: "Error",
        description: "Message sent but failed to sync with server",
        variant: "destructive"
      });
      return false;
    }
  };

  return {
    sendMessageToTicket
  };
};
