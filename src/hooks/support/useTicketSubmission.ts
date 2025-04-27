
import { useApp } from '@/context/AppContext';
import { useTicketCreation } from './useTicketCreation';
import { useLocalStorageSync } from './useLocalStorageSync';
import { toast } from "@/hooks/use-toast";
import { SupportOption } from '@/components/shared/support/SupportOptionsList';
import { useState } from 'react';
import { SupportTicket } from '@/types/chat';

export const useTicketSubmission = () => {
  const { currentUser } = useApp();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { createTicket, createInitialMessage, createAutoResponse } = useTicketCreation();
  const { updateStoredTickets, updateUnreadMessages, dispatchEvents } = useLocalStorageSync();

  const handleSubmit = async (
    selectedOption: SupportOption,
    message: string,
    onSuccess?: (ticketId: string, subject: string, message: string) => void
  ) => {
    if (!message.trim()) {
      toast({
        title: "Message Required",
        description: "Please provide details before submitting.",
        variant: "destructive"
      });
      return false;
    }

    // Make sure we have a valid user
    if (!currentUser?.id) {
      toast({
        title: "Error",
        description: "You must be logged in to submit a support ticket",
        variant: "destructive"
      });
      return false;
    }

    setIsSubmitting(true);
    
    try {
      console.log("Creating ticket with subject:", selectedOption.label);
      const ticketData = await createTicket(selectedOption.label);
      
      if (!ticketData || !ticketData.id) {
        throw new Error("Failed to create ticket - no ticket data returned");
      }
      
      console.log("Ticket created successfully, ID:", ticketData.id);
      
      // Send the initial message from user
      await createInitialMessage(ticketData.id, message, currentUser?.id || 'anonymous');
      console.log("Initial message created");
      
      // Send auto response from support
      await createAutoResponse(ticketData.id, selectedOption.label);
      console.log("Auto response created");

      const newTicket: SupportTicket = {
        id: ticketData.id,
        subject: selectedOption.label,
        createdAt: new Date().toISOString(),
        status: 'open' as const, // Explicitly type as 'open', one of the allowed values
        messages: [
          {
            id: Date.now().toString(),
            text: message,
            sender: {
              id: currentUser?.id || 'anonymous',
              name: currentUser?.name || 'Anonymous',
              avatar: currentUser?.avatar || '/placeholder.svg',
            },
            timestamp: new Date().toISOString(),
            isSupport: false
          },
          {
            id: 'support-auto-' + Date.now(),
            text: `Thank you for contacting support about "${selectedOption.label}". A support agent will review your request and respond shortly.`,
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

      updateStoredTickets(newTicket);
      updateUnreadMessages(ticketData.id);
      dispatchEvents(ticketData.id);
      
      if (onSuccess) {
        onSuccess(ticketData.id, selectedOption.label, message);
      }

      toast({
        title: "Support Request Sent",
        description: `Your ${selectedOption.label.toLowerCase()} request has been submitted. A support agent will get back to you soon.`,
      });

      setIsSubmitting(false);
      return true;
    } catch (error) {
      console.error('Error submitting support ticket:', error);
      toast({
        title: "Error",
        description: "Failed to create support ticket. Please try again.",
        variant: "destructive"
      });
      setIsSubmitting(false);
      return false;
    }
  };

  return {
    isSubmitting,
    handleSubmit
  };
};
