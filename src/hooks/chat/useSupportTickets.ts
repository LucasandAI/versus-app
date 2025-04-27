
import { useState } from 'react';
import { SupportTicket } from '@/types/chat';
import { useSupportTicketState } from './support/useSupportTicketState';
import { useSupportTicketStorage } from './support/useSupportTicketStorage';
import { toast } from '@/hooks/use-toast';

export const useSupportTickets = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { supportMessage, setSupportMessage, selectedSupportOption, setSelectedSupportOption } = useSupportTicketState();
  const { createTicketInSupabase, sendMessageToTicket } = useSupportTicketStorage();

  const handleSubmitSupportTicket = async () => {
    if (!supportMessage.trim() || !selectedSupportOption) {
      toast({
        title: "Incomplete Form",
        description: "Please select a topic and provide message details.",
        variant: "destructive"
      });
      return null;
    }

    setIsSubmitting(true);

    try {
      const ticket = await createTicketInSupabase(
        selectedSupportOption.label,
        supportMessage
      );

      if (ticket) {
        toast({
          title: "Support Ticket Created",
          description: "Your support request has been submitted successfully."
        });

        // Reset form
        setSupportMessage('');
        setSelectedSupportOption(null);
      }

      setIsSubmitting(false);
      return ticket;
    } catch (error) {
      console.error('[useSupportTickets] Error submitting ticket:', error);
      setIsSubmitting(false);
      return null;
    }
  };

  const sendSupportMessage = async (ticketId: string, message: string) => {
    if (!message.trim()) return false;
    return await sendMessageToTicket(ticketId, message);
  };

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
