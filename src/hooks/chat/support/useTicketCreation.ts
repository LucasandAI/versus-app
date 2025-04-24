
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useApp } from '@/context/AppContext';
import { SupportTicket } from '@/types/chat';

export const useTicketCreation = () => {
  const { currentUser } = useApp();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const createTicket = async (subject: string) => {
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

    if (ticketError) throw ticketError;
    if (!ticketData) {
      throw new Error("No ticket data returned after insert");
    }

    return ticketData;
  };

  const sendInitialMessage = async (ticketId: string, message: string, userId: string) => {
    const { error: messageError } = await supabase
      .from('support_messages')
      .insert({
        ticket_id: ticketId,
        sender_id: userId,
        text: message,
        is_support: false
      });

    if (messageError) throw messageError;
  };

  const sendAutoResponse = async (ticketId: string) => {
    const { error: autoResponseError } = await supabase
      .from('support_messages')
      .insert({
        ticket_id: ticketId,
        sender_id: null,
        text: "Thanks for reaching out! We'll review your message and get back to you shortly.",
        is_support: true
      });

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
