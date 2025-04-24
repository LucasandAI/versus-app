
import { useCallback } from 'react';
import { useTicketSubmission } from './support/useTicketSubmission';
import { useMessageSubmission } from './support/useMessageSubmission';
import { useSupportTicketState } from './support/useSupportTicketState';

export const useSupportTickets = () => {
  const { supportMessage, setSupportMessage, selectedSupportOption, setSelectedSupportOption } = useSupportTicketState();
  const { isSubmitting, handleSubmitSupportTicket } = useTicketSubmission();
  const { sendSupportMessage } = useMessageSubmission();

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
