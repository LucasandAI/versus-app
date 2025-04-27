
import { SupportTicket } from '@/types/chat';

export const useLocalStorageSync = () => {
  const updateStoredTickets = (newTicket: SupportTicket) => {
    const existingTickets = localStorage.getItem('supportTickets');
    const tickets = existingTickets ? JSON.parse(existingTickets) : [];
    tickets.unshift(newTicket);
    localStorage.setItem('supportTickets', JSON.stringify(tickets));
  };

  const updateUnreadMessages = (ticketId: string) => {
    const unreadMessages = localStorage.getItem('unreadMessages');
    const unreadMap = unreadMessages ? JSON.parse(unreadMessages) : {};
    unreadMap[ticketId] = 1;
    localStorage.setItem('unreadMessages', JSON.stringify(unreadMap));
  };

  const dispatchEvents = (ticketId: string) => {
    window.dispatchEvent(new CustomEvent('supportTicketCreated', { 
      detail: { ticketId, count: 1 }
    }));
    window.dispatchEvent(new CustomEvent('unreadMessagesUpdated'));
    window.dispatchEvent(new CustomEvent('notificationsUpdated'));
  };

  return {
    updateStoredTickets,
    updateUnreadMessages,
    dispatchEvents
  };
};
