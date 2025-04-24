
import { useState, useCallback } from 'react';
import { SupportTicket } from '@/types/chat';
import { useApp } from '@/context/AppContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export const useSupportTickets = () => {
  const { currentUser } = useApp();
  const [supportMessage, setSupportMessage] = useState("");
  const [selectedSupportOption, setSelectedSupportOption] = useState<{id: string, label: string} | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmitSupportTicket = useCallback(async () => {
    if (!currentUser) {
      toast({
        title: "Error",
        description: "You must be logged in to submit a support ticket",
        variant: "destructive"
      });
      return null;
    }
    
    if (!selectedSupportOption) {
      toast({
        title: "Error",
        description: "Please select a support topic",
        variant: "destructive"
      });
      return null;
    }
    
    if (!supportMessage.trim()) {
      toast({
        title: "Message Required",
        description: "Please provide details before submitting.",
        variant: "destructive"
      });
      return null;
    }

    setIsSubmitting(true);

    try {
      console.log("Creating support ticket:", {
        subject: selectedSupportOption.label,
        user_id: currentUser.id
      });
      
      // Step 1: Create the support ticket
      const { data: ticketData, error: ticketError } = await supabase
        .from('support_tickets')
        .insert({
          subject: selectedSupportOption.label,
          user_id: currentUser.id
        })
        .select()
        .single();

      if (ticketError) {
        console.error("Support ticket creation error:", ticketError);
        toast({
          title: "Error Creating Ticket",
          description: ticketError.message || "Failed to create support ticket",
          variant: "destructive"
        });
        setIsSubmitting(false);
        return null;
      }

      if (!ticketData) {
        console.error("No ticket data returned after insert");
        toast({
          title: "Error",
          description: "Failed to create support ticket - no data returned",
          variant: "destructive"
        });
        setIsSubmitting(false);
        return null;
      }

      console.log("Ticket created successfully:", ticketData);

      // Step 2: Add the user's initial message
      const { error: messageError } = await supabase
        .from('support_messages')
        .insert({
          ticket_id: ticketData.id,
          sender_id: currentUser.id,
          text: supportMessage,
          is_support: false
        });

      if (messageError) {
        console.error("Support message creation error:", messageError);
        toast({
          title: "Error Adding Message",
          description: messageError.message || "Your ticket was created but we couldn't add your message",
          variant: "destructive"
        });
        setIsSubmitting(false);
        return null;
      }

      // Step 3: Add the auto-response message
      const { error: autoResponseError } = await supabase
        .from('support_messages')
        .insert({
          ticket_id: ticketData.id,
          sender_id: 'system',
          text: `Thank you for contacting support about "${selectedSupportOption.label}". A support agent will review your request and respond shortly.`,
          is_support: true
        });

      if (autoResponseError) {
        console.error("Auto-response creation error:", autoResponseError);
      }

      // Create the ticket object for the UI
      const newTicket: SupportTicket = {
        id: ticketData.id, // Use the real UUID from Supabase
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
      setIsSubmitting(false);
      
      return newTicket;
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      console.error('Error creating support ticket:', error);
      toast({
        title: "Error",
        description: `Failed to create support ticket: ${errorMessage}`,
        variant: "destructive"
      });
      setIsSubmitting(false);
      return null;
    }
  }, [currentUser, selectedSupportOption, supportMessage]);

  const sendSupportMessage = useCallback(async (ticketId: string, message: string) => {
    if (!currentUser) {
      toast({
        title: "Authentication Error",
        description: "You must be logged in to send messages",
        variant: "destructive"
      });
      return false;
    }

    // Check if the ticketId is a temporary ID (starts with "support-")
    if (ticketId.startsWith('support-') || ticketId.startsWith('temp-')) {
      toast({
        title: "Error",
        description: "Cannot send messages until ticket is fully created",
        variant: "destructive"
      });
      return false;
    }

    try {
      // First update the UI immediately for better user experience
      const optimisticMessage = {
        id: `temp-${Date.now()}`,
        text: message,
        sender: {
          id: currentUser.id,
          name: currentUser.name || 'You',
          avatar: currentUser.avatar || '/placeholder.svg'
        },
        timestamp: new Date().toISOString(),
        isSupport: false
      };
      
      // Update local storage with the optimistic message
      const existingTickets = localStorage.getItem('supportTickets');
      if (existingTickets) {
        const storedTickets: SupportTicket[] = JSON.parse(existingTickets);
        const updatedTickets = storedTickets.map(ticket => {
          if (ticket.id === ticketId) {
            return {
              ...ticket,
              messages: [
                ...(ticket.messages || []),
                optimisticMessage
              ]
            };
          }
          return ticket;
        });
        localStorage.setItem('supportTickets', JSON.stringify(updatedTickets));
      }
      
      // Dispatch event to update the UI
      window.dispatchEvent(new CustomEvent('supportTicketUpdated', { 
        detail: { ticketId, message: optimisticMessage }
      }));
      
      // Then send to Supabase
      const { error } = await supabase
        .from('support_messages')
        .insert({
          ticket_id: ticketId,
          sender_id: currentUser.id,
          text: message,
          is_support: false
        });
        
      if (error) {
        console.error('Error sending support message:', error);
        toast({
          title: "Error",
          description: "Failed to send message to server, but it appears in your chat",
          variant: "destructive"
        });
      }

      return true;
    } catch (error) {
      console.error('Error sending support message:', error);
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive"
      });
      return false;
    }
  }, [currentUser]);

  return {
    supportMessage,
    setSupportMessage,
    selectedSupportOption,
    setSelectedSupportOption,
    handleSubmitSupportTicket,
    isSubmitting,
    sendSupportMessage
  };
};
