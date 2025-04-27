
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
    if (!currentUser) {
      console.error('[useTicketCreation] No current user found');
      return null;
    }
    
    try {
      const { data: ticketData, error: ticketError } = await supabase
        .from('support_tickets')
        .insert({
          subject,
          user_id: currentUser.id
        })
        .select()
        .single();

      console.log('[useTicketCreation] Ticket creation result:', { ticketData, ticketError });

      if (ticketError) {
        console.error('[useTicketCreation] Error creating ticket:', ticketError);
        throw ticketError;
      }
      
      if (!ticketData) {
        console.error('[useTicketCreation] No ticket data returned after insert');
        throw new Error("No ticket data returned after insert");
      }

      return ticketData;
    } catch (error) {
      console.error('[useTicketCreation] Error in createTicket:', error);
      throw error; // Re-throw to be handled by the caller
    }
  };

  const sendInitialMessage = async (ticketId: string, message: string, userId: string) => {
    console.log('[useTicketCreation] Sending initial message for ticket:', ticketId);
    try {
      const { error: messageError } = await supabase
        .from('support_messages')
        .insert({
          ticket_id: ticketId,
          sender_id: userId,
          text: message,
          is_support: false
        });

      console.log('[useTicketCreation] Initial message result:', { messageError });
      if (messageError) {
        console.error('[useTicketCreation] Error sending initial message:', messageError);
        throw messageError;
      }
    } catch (error) {
      console.error('[useTicketCreation] Error in sendInitialMessage:', error);
      throw error; // Re-throw to be handled by the caller
    }
  };

  const sendAutoResponse = async (ticketId: string) => {
    console.log('[useTicketCreation] Sending auto-response for ticket:', ticketId);
    try {
      const { error: autoResponseError } = await supabase
        .from('support_messages')
        .insert({
          ticket_id: ticketId,
          sender_id: null,
          text: "Thanks for reaching out! We'll review your message and get back to you shortly.",
          is_support: true
        });

      console.log('[useTicketCreation] Auto-response result:', { autoResponseError });
      if (autoResponseError) {
        console.error('[useTicketCreation] Error sending auto-response:', autoResponseError);
        throw autoResponseError;
      }
    } catch (error) {
      console.error('[useTicketCreation] Error in sendAutoResponse:', error);
      throw error; // Re-throw to be handled by the caller
    }
  };

  return {
    isSubmitting,
    setIsSubmitting,
    createTicket,
    sendInitialMessage,
    sendAutoResponse
  };
};
