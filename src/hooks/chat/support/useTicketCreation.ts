
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useApp } from '@/context/AppContext';
import { SupportTicket } from '@/types/chat';
import { useLocalStorageUpdate } from './useLocalStorageUpdate';

export const useTicketCreation = () => {
  const { currentUser } = useApp();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { updateStoredTickets, dispatchTicketEvents } = useLocalStorageUpdate();

  const createTicket = async (subject: string) => {
    console.log('[useTicketCreation] Starting ticket creation for subject:', subject);
    if (!currentUser) return null;
    
    const { data: ticketData, error: ticketError } = await supabase
      .from('support_tickets')
      .insert({
        subject,
        user_id: currentUser.id,
        status: 'open'
      })
      .select()
      .single();

    console.log('[useTicketCreation] Ticket creation result:', { ticketData, ticketError });

    if (ticketError) throw ticketError;
    if (!ticketData) {
      throw new Error("No ticket data returned after insert");
    }

    return ticketData;
  };

  const sendInitialMessage = async (ticketId: string, message: string, userId: string) => {
    console.log('[useTicketCreation] Sending initial message for ticket:', ticketId);
    const { error: messageError } = await supabase
      .from('support_messages')
      .insert({
        ticket_id: ticketId,
        sender_id: userId,
        text: message,
        is_support: false
      });

    console.log('[useTicketCreation] Initial message result:', { messageError });
    if (messageError) throw messageError;
  };

  const sendAutoResponse = async (ticketId: string) => {
    console.log('[useTicketCreation] Sending auto-response for ticket:', ticketId);
    const { error: autoResponseError } = await supabase
      .from('support_messages')
      .insert({
        ticket_id: ticketId,
        sender_id: null,
        text: "Thanks for reaching out! We'll review your message and get back to you shortly.",
        is_support: true
      });

    console.log('[useTicketCreation] Auto-response result:', { autoResponseError });
    if (autoResponseError) throw autoResponseError;
  };

  return {
    isSubmitting,
    setIsSubmitting,
    createTicket,
    sendInitialMessage,
    sendAutoResponse
  };
};
