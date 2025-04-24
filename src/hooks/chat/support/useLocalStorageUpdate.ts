
import { SupportTicket } from '@/types/chat';

export const useLocalStorageUpdate = () => {
  const updateStoredTickets = (newTicket: SupportTicket) => {
    const existingTickets = localStorage.getItem('supportTickets');
    const storedTickets = existingTickets ? JSON.parse(existingTickets) : [];
    localStorage.setItem('supportTickets', JSON.stringify([newTicket, ...storedTickets]));
  };

  const dispatchTicketEvents = (ticketId: string) => {
    window.dispatchEvent(new CustomEvent('supportTicketCreated', { 
      detail: { ticketId }
    }));
  };

  return {
    updateStoredTickets,
    dispatchTicketEvents
  };
};
