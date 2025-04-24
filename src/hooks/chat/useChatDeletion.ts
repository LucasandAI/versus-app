
import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export const useChatDeletion = () => {
  const deleteChatMutation = useMutation({
    mutationFn: async ({ chatId, isTicket }: { chatId: string, isTicket?: boolean }) => {
      if (isTicket) {
        // Delete support ticket and all its messages
        try {
          // First delete messages
          const { error: messagesError } = await supabase
            .from('support_messages')
            .delete()
            .eq('ticket_id', chatId);
          
          if (messagesError) {
            console.error('Error deleting ticket messages:', messagesError);
            throw messagesError;
          }
          
          // Then delete the ticket
          const { error: ticketError } = await supabase
            .from('support_tickets')
            .delete()
            .eq('id', chatId);
            
          if (ticketError) {
            console.error('Error deleting ticket:', ticketError);
            throw ticketError;
          }
          
          // Update local storage
          try {
            const storedTickets = localStorage.getItem('supportTickets');
            if (storedTickets) {
              const parsedTickets = JSON.parse(storedTickets);
              const updatedTickets = parsedTickets.filter((t: any) => t.id !== chatId);
              localStorage.setItem('supportTickets', JSON.stringify(updatedTickets));
            }
          } catch (error) {
            console.error('Error updating localStorage:', error);
          }
          
          // Trigger custom event to notify other components
          window.dispatchEvent(new CustomEvent('supportTicketDeleted', { 
            detail: { ticketId: chatId }
          }));
          
          return { success: true };
        } catch (error) {
          console.error('Error deleting support ticket:', error);
          throw error;
        }
      } else {
        // Logic for deleting regular chats (if needed)
        console.log("Regular chat deletion not implemented");
        return { success: true };
      }
    },
    onSuccess: () => {
      toast({
        title: "Chat Deleted",
        description: "The conversation has been removed from your chats."
      });
    },
    onError: (error) => {
      console.error('Error deleting chat:', error);
      toast({
        title: "Error",
        description: "Failed to delete the conversation. Please try again.",
        variant: "destructive"
      });
    }
  });

  // Return a function with the expected signature that calls the mutation
  const deleteChat = (chatId: string, isTicket: boolean) => {
    deleteChatMutation.mutate({ chatId, isTicket });
  };

  return { deleteChat };
};
