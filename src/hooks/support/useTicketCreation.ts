
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useApp } from '@/context/AppContext';

export const useTicketCreation = () => {
  const { currentUser } = useApp();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const createTicket = async (subject: string) => {
    if (!currentUser?.id) {
      throw new Error('User must be logged in to create a ticket');
    }

    console.log("Creating ticket in Supabase with subject:", subject);

    const { data, error } = await supabase
      .from('support_tickets')
      .insert({
        subject,
        user_id: currentUser.id,
        status: 'open'
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating ticket:", error);
      throw error;
    }
    
    console.log("Ticket created successfully:", data);
    return data;
  };

  const createInitialMessage = async (ticketId: string, message: string, userId: string) => {
    console.log("Creating initial message for ticket", ticketId);
    
    const { error } = await supabase
      .from('support_messages')
      .insert({
        ticket_id: ticketId,
        sender_id: userId,
        text: message,
        is_support: false
      });

    if (error) {
      console.error("Error creating initial message:", error);
      throw error;
    }
    
    console.log("Initial message created successfully");
  };

  const createAutoResponse = async (ticketId: string, subject: string) => {
    console.log("Creating auto response for ticket", ticketId);
    
    const { error } = await supabase
      .from('support_messages')
      .insert({
        ticket_id: ticketId,
        text: `Thank you for contacting support about "${subject}". A support agent will review your request and respond shortly.`,
        sender_id: null,
        is_support: true
      });

    if (error) {
      console.error("Error creating auto response:", error);
      throw error;
    }
    
    console.log("Auto response created successfully");
  };

  return {
    isSubmitting,
    setIsSubmitting,
    createTicket,
    createInitialMessage,
    createAutoResponse
  };
};
