
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export const useTicketDeletionService = () => {
  const deleteTicketFromSupabase = async (ticketId: string) => {
    try {
      console.log('[useTicketDeletionService] Deleting ticket:', ticketId);
      
      // First delete related messages
      const { error: messagesError } = await supabase
        .from('support_messages')
        .delete()
        .eq('ticket_id', ticketId);
      
      if (messagesError) {
        console.error('[useTicketDeletionService] Error deleting messages:', messagesError);
        throw messagesError;
      }
      
      // Then delete the ticket
      const { error: ticketError } = await supabase
        .from('support_tickets')
        .delete()
        .eq('id', ticketId);
        
      if (ticketError) {
        console.error('[useTicketDeletionService] Error deleting ticket:', ticketError);
        throw ticketError;
      }
      
      // Dispatch events for UI updates
      window.dispatchEvent(new CustomEvent('supportTicketDeleted', { 
        detail: { ticketId }
      }));
      
      toast({
        title: "Success",
        description: "Support ticket deleted successfully",
        duration: 3000,
      });
      
      return true;
    } catch (error) {
      console.error('[useTicketDeletionService] Error:', error);
      toast({
        title: "Error",
        description: "Failed to delete the support ticket",
        variant: "destructive"
      });
      return false;
    }
  };

  return {
    deleteTicketFromSupabase
  };
};
