
import { SupportTicket } from '@/types/chat';

export const useLocalStorageUpdate = () => {
  const updateStoredTickets = (newTicket: SupportTicket) => {
    console.log('[useLocalStorageUpdate] Updating stored tickets with new ticket:', newTicket.id);
    try {
      const existingTickets = localStorage.getItem('supportTickets');
      const storedTickets = existingTickets ? JSON.parse(existingTickets) : [];
      localStorage.setItem('supportTickets', JSON.stringify([newTicket, ...storedTickets]));
      console.log('[useLocalStorageUpdate] Successfully updated localStorage');
    } catch (error) {
      console.error('[useLocalStorageUpdate] Error updating localStorage:', error);
    }
  };

  const dispatchTicketEvents = (ticketId: string) => {
    console.log('[useLocalStorageUpdate] Dispatching ticket events for:', ticketId);
    window.dispatchEvent(new CustomEvent('supportTicketCreated', { 
      detail: { ticketId }
    }));
    window.dispatchEvent(new Event('ticketUpdated'));
  };

  return {
    updateStoredTickets,
    dispatchTicketEvents
  };
};
