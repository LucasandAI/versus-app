
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from "@/hooks/use-toast";
import { useApp } from '@/context/AppContext';
import { SupportTicket } from '@/types/chat';

export const useTicketCreation = () => {
  const { currentUser } = useApp();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const createTicket = async (subject: string) => {
    if (!currentUser?.id) {
      throw new Error('User must be logged in to create a ticket');
    }

    const { data, error } = await supabase
      .from('support_tickets')
      .insert({
        subject,
        user_id: currentUser.id,
        status: 'open'
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  };

  const createInitialMessage = async (ticketId: string, message: string, userId: string) => {
    const { error } = await supabase
      .from('support_messages')
      .insert({
        ticket_id: ticketId,
        sender_id: userId,
        text: message,
        is_support: false
      });

    if (error) throw error;
  };

  const createAutoResponse = async (ticketId: string, subject: string) => {
    const { error } = await supabase
      .from('support_messages')
      .insert({
        ticket_id: ticketId,
        text: `Thank you for contacting support about "${subject}". A support agent will review your request and respond shortly.`,
        sender_id: null,
        is_support: true
      });

    if (error) throw error;
  };

  return {
    isSubmitting,
    setIsSubmitting,
    createTicket,
    createInitialMessage,
    createAutoResponse
  };
};
