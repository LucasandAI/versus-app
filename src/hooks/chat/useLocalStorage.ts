
import { useCallback } from 'react';
import { ChatMessage, SupportTicket } from '@/types/chat';
import { ChatStateData } from '@/types/chat-state';

export const useLocalStorage = () => {
  const loadFromStorage = useCallback(() => {
    const savedMessages = localStorage.getItem('chatMessages');
    const savedTickets = localStorage.getItem('supportTickets');
    const savedUnread = localStorage.getItem('unreadMessages');
    
    const messages = savedMessages ? JSON.parse(savedMessages) : {};
    const unreadMessages = savedUnread ? JSON.parse(savedUnread) : {};
    
    let ticketsRecord: Record<string, SupportTicket> = {};
    if (savedTickets) {
      const tickets: SupportTicket[] = JSON.parse(savedTickets);
      tickets.forEach(ticket => {
        ticketsRecord[ticket.id] = ticket;
      });
    }
    
    return {
      messages,
      supportTickets: ticketsRecord,
      unreadMessages
    };
  }, []);

  const saveMessages = useCallback((messages: Record<string, ChatMessage[]>) => {
    localStorage.setItem('chatMessages', JSON.stringify(messages));
  }, []);

  const saveUnreadMessages = useCallback((unreadMessages: Record<string, number>) => {
    localStorage.setItem('unreadMessages', JSON.stringify(unreadMessages));
    const event = new CustomEvent('unreadMessagesUpdated');
    window.dispatchEvent(event);
  }, []);

  const saveSupportTickets = useCallback((tickets: Record<string, SupportTicket>) => {
    const ticketsArray = Object.values(tickets);
    localStorage.setItem('supportTickets', JSON.stringify(ticketsArray));
    localStorage.setItem('supportTicketsRecord', JSON.stringify(tickets));
  }, []);

  return {
    loadFromStorage,
    saveMessages,
    saveUnreadMessages,
    saveSupportTickets
  };
};
