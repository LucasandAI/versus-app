
import { useState, useCallback } from 'react';
import { SupportTicket } from '@/types/chat';
import { useApp } from '@/context/AppContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export const useSupportTickets = () => {
  const { currentUser } = useApp();
  const [supportMessage, setSupportMessage] = useState("");
  const [selectedSupportOption, setSelectedSupportOption] = useState<{id: string, label: string} | null>(null);

  const handleSubmitSupportTicket = useCallback(async () => {
    if (!currentUser || !selectedSupportOption) {
      toast({
        title: "Error",
        description: "Please select a support topic and enter a message",
        variant: "destructive"
      });
      return;
    }
    
    if (!supportMessage.trim()) {
      toast({
        title: "Message Required",
        description: "Please provide details before submitting.",
        variant: "destructive"
      });
      return;
    }

    try {
      const { data: ticketData, error: ticketError } = await supabase
        .from('support_tickets')
        .insert({
          subject: selectedSupportOption.label,
          user_id: currentUser.id
        })
        .select()
        .single();

      if (ticketError || !ticketData) {
        throw new Error(ticketError?.message || 'Failed to create support ticket');
      }

      const { error: messageError } = await supabase
        .from('support_messages')
        .insert({
          ticket_id: ticketData.id,
          sender_id: currentUser.id,
          text: supportMessage,
          is_support: false
        });

      if (messageError) {
        throw new Error(messageError.message);
      }

      const { error: autoResponseError } = await supabase
        .from('support_messages')
        .insert({
          ticket_id: ticketData.id,
          sender_id: 'system',
          text: `Thank you for contacting support about "${selectedSupportOption.label}". A support agent will review your request and respond shortly.`,
          is_support: true
        });

      if (autoResponseError) {
        console.error('Failed to create auto-response:', autoResponseError);
      }

      const newTicket: SupportTicket = {
        id: ticketData.id,
        subject: selectedSupportOption.label,
        createdAt: new Date().toISOString(),
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
            text: `Thank you for contacting support about "${selectedSupportOption.label}". A support agent will review your request and respond shortly.`,
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

      // Update local storage and trigger events
      const existingTickets = localStorage.getItem('supportTickets');
      const storedTickets = existingTickets ? JSON.parse(existingTickets) : [];
      localStorage.setItem('supportTickets', JSON.stringify([newTicket, ...storedTickets]));

      window.dispatchEvent(new CustomEvent('supportTicketCreated', { 
        detail: { ticketId: ticketData.id }
      }));
      
      toast({
        title: "Support Ticket Created",
        description: "Your support request has been submitted successfully."
      });
      
      setSupportMessage("");
      setSelectedSupportOption(null);
      
      return newTicket;
      
    } catch (error) {
      console.error('Error creating support ticket:', error);
      toast({
        title: "Error",
        description: "Failed to create support ticket. Please try again.",
        variant: "destructive"
      });
      return null;
    }
  }, [currentUser, selectedSupportOption, supportMessage]);

  return {
    supportMessage,
    setSupportMessage,
    selectedSupportOption,
    setSelectedSupportOption,
    handleSubmitSupportTicket
  };
};
