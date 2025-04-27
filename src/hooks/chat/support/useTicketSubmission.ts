
import { useCallback } from 'react';
import { toast } from '@/hooks/use-toast';
import { useApp } from '@/context/AppContext';
import { SupportTicket } from '@/types/chat';
import { useTicketCreation } from './useTicketCreation';
import { useLocalStorageUpdate } from './useLocalStorageUpdate';

export const useTicketSubmission = (
  selectedSupportOption: { id: string; label: string } | null,
  supportMessage: string
) => {
  const { currentUser } = useApp();
  const { isSubmitting, setIsSubmitting, createTicket, sendInitialMessage, sendAutoResponse } = useTicketCreation();
  const { updateStoredTickets, dispatchTicketEvents } = useLocalStorageUpdate();

  const handleSubmitSupportTicket = useCallback(async () => {
    console.log('[useTicketSubmission] Starting ticket submission process...');
    
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
      console.log('[useTicketSubmission] Creating ticket in Supabase...');
      const ticketData = await createTicket(selectedSupportOption.label);
      if (!ticketData) {
        throw new Error("Failed to create ticket");
      }

      console.log('[useTicketSubmission] Sending initial message...');
      await sendInitialMessage(ticketData.id, supportMessage, currentUser.id);
      console.log('[useTicketSubmission] Sending auto-response...');
      await sendAutoResponse(ticketData.id);

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

      updateStoredTickets(newTicket);
      dispatchTicketEvents(ticketData.id);
      
      toast({
        title: "Support Ticket Created",
        description: "Your support request has been submitted successfully.",
        duration: 3000,
      });
      
      // Important: Reset submission state to allow new submissions
      setIsSubmitting(false);
      return newTicket;
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      console.error('[useTicketSubmission] Error creating support ticket:', error);
      toast({
        title: "Error",
        description: `Failed to create support ticket: ${errorMessage}`,
        variant: "destructive",
        duration: 3000,
      });
      // Always reset submission state on error
      setIsSubmitting(false);
      return null;
    }
  }, [currentUser, selectedSupportOption, supportMessage, createTicket, sendInitialMessage, sendAutoResponse, setIsSubmitting, updateStoredTickets, dispatchTicketEvents]);

  return {
    isSubmitting,
    handleSubmitSupportTicket
  };
};
