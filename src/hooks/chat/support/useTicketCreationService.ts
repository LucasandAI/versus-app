
import { supabase } from '@/integrations/supabase/client';
import { SupportTicket } from '@/types/chat';
import { toast } from '@/hooks/use-toast';
import { useTicketInitialMessage } from './ticket/useTicketInitialMessage';
import { useTicketAutoResponse } from './ticket/useTicketAutoResponse';

export const useTicketCreationService = () => {
  const { sendInitialMessage } = useTicketInitialMessage();
  const { sendAutoResponse } = useTicketAutoResponse();

  const createTicketInSupabase = async (subject: string, message: string) => {
    try {
      // Step 1: Create the ticket
      const { data: ticketData, error: ticketError } = await supabase
        .from('support_tickets')
        .insert({
          subject
        })
        .select()
        .single();

      if (ticketError) {
        console.error('[useTicketCreationService] Error creating ticket:', ticketError);
        throw ticketError;
      }
      
      if (!ticketData) {
        console.error('[useTicketCreationService] No ticket data returned');
        throw new Error("No ticket data returned");
      }

      // Step 2: Add the initial message and auto-response
      await sendInitialMessage(ticketData.id, message);
      await sendAutoResponse(ticketData.id);

      // Create optimistic ticket object
      const newTicket: SupportTicket = {
        id: ticketData.id,
        subject,
        createdAt: ticketData.created_at,
        messages: [
          {
            id: Date.now().toString(),
            text: message,
            sender: {
              id: 'user',
              name: 'You',
              avatar: '/placeholder.svg'
            },
            timestamp: new Date().toISOString(),
            isSupport: false
          },
          {
            id: 'auto-' + Date.now(),
            text: `Thank you for contacting support about "${subject}". A support agent will review your request and respond shortly.`,
            sender: {
              id: 'support',
              name: 'Support Team',
              avatar: '/placeholder.svg'
            },
            timestamp: new Date(Date.now() + 1000).toISOString(),
            isSupport: true
          }
        ]
      };

      return newTicket;
    } catch (error) {
      console.error('[useTicketCreationService] Error:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create support ticket",
        variant: "destructive"
      });
      return null;
    }
  };

  return {
    createTicketInSupabase
  };
};
