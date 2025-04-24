
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useApp } from '@/context/AppContext';
import { SupportTicket } from '@/types/chat';

export const useTicketSubmission = () => {
  const { currentUser } = useApp();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const handleSubmitSupportTicket = useCallback(async () => {
    if (!currentUser) {
      toast({
        title: "Error",
        description: "You must be logged in to submit a support ticket",
        variant: "destructive",
        duration: 3000,
      });
      return null;
    }
    
    if (!selectedSupportOption) {
      toast({
        title: "Error",
        description: "Please select a support topic",
        variant: "destructive",
        duration: 3000,
      });
      return null;
    }
    
    if (!supportMessage.trim()) {
      toast({
        title: "Message Required",
        description: "Please provide details before submitting.",
        variant: "destructive",
        duration: 3000,
      });
      return null;
    }

    setIsSubmitting(true);

    try {
      const { data: ticketData, error: ticketError } = await supabase
        .from('support_tickets')
        .insert({
          subject: selectedSupportOption.label,
          user_id: currentUser.id,
          status: 'open'
        })
        .select()
        .single();

      if (ticketError) throw ticketError;

      if (!ticketData) {
        throw new Error("No ticket data returned after insert");
      }

      const { error: messageError } = await supabase
        .from('support_messages')
        .insert({
          ticket_id: ticketData.id,
          sender_id: currentUser.id,
          text: supportMessage,
          is_support: false
        });

      if (messageError) throw messageError;

      // Add the automatic support team response
      const { error: autoResponseError } = await supabase
        .from('support_messages')
        .insert({
          ticket_id: ticketData.id,
          sender_id: null,
          text: "Thanks for reaching out! We'll review your message and get back to you shortly.",
          is_support: true
        });

      if (autoResponseError) throw autoResponseError;

      const newTicket: SupportTicket = {
        id: ticketData.id,
        subject: selectedSupportOption.label,
        createdAt: new Date().toISOString(),
        status: 'open',
        messages: [
          {
            id: Date.now().toString(),
            text: supportMessage,
            sender: {
              id: currentUser.id,
              name: currentUser.name,
              avatar: currentUser.avatar || '/placeholder.svg'
            },
            timestamp: new Date().toISOString(),
            isSupport: false
          },
          {
            id: 'auto-' + Date.now(),
            text: "Thanks for reaching out! We'll review your message and get back to you shortly.",
            sender: {
              id: 'system',
              name: 'Support Team',
              avatar: '/placeholder.svg'
            },
            timestamp: new Date(Date.now() + 1000).toISOString(),
            isSupport: true
          }
        ]
      };

      // Update local storage
      const existingTickets = localStorage.getItem('supportTickets');
      const storedTickets = existingTickets ? JSON.parse(existingTickets) : [];
      localStorage.setItem('supportTickets', JSON.stringify([newTicket, ...storedTickets]));

      window.dispatchEvent(new CustomEvent('supportTicketCreated', { 
        detail: { ticketId: ticketData.id }
      }));
      
      toast({
        title: "Support Ticket Created",
        description: "Your support request has been submitted successfully.",
        duration: 3000,
      });
      
      setIsSubmitting(false);
      
      return newTicket;
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      console.error('Error creating support ticket:', error);
      toast({
        title: "Error",
        description: `Failed to create support ticket: ${errorMessage}`,
        variant: "destructive",
        duration: 3000,
      });
      setIsSubmitting(false);
      return null;
    }
  }, [currentUser, selectedSupportOption, supportMessage]);

  return {
    isSubmitting,
    handleSubmitSupportTicket
  };
};
