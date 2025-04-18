
import { useState, useCallback } from 'react';
import { SupportTicket, ChatMessage } from '@/types/chat';

export const useSupportTickets = (
  saveTickets: (tickets: Record<string, SupportTicket>) => void,
  updateUnreadCount: (ticketId: string, count: number) => void
) => {
  const [supportTickets, setSupportTickets] = useState<Record<string, SupportTicket>>({});

  const createSupportTicket = useCallback((
    ticketId: string,
    subject: string,
    message: string,
    userId: string,
    userName: string,
    userAvatar?: string
  ) => {
    const timestamp = new Date().toISOString();
    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      text: message,
      sender: {
        id: userId,
        name: userName,
        avatar: userAvatar || '/placeholder.svg'
      },
      timestamp,
      isSupport: false
    };

    const supportResponse: ChatMessage = {
      id: 'support-' + Date.now(),
      text: `Thank you for contacting support about "${subject}". A support agent will review your request and respond shortly.`,
      sender: {
        id: 'support',
        name: 'Support Team',
        avatar: '/placeholder.svg'
      },
      timestamp: new Date(Date.now() + 1000).toISOString(),
      isSupport: true
    };

    const ticket: SupportTicket = {
      id: ticketId,
      subject,
      createdAt: timestamp,
      messages: [newMessage, supportResponse]
    };

    setSupportTickets(prev => {
      const updated = { ...prev, [ticketId]: ticket };
      saveTickets(updated);
      return updated;
    });

    updateUnreadCount(ticketId, 1);
    
    window.dispatchEvent(new CustomEvent('supportTicketCreated', { 
      detail: { ticketId, count: 1 }
    }));
  }, [saveTickets, updateUnreadCount]);

  return {
    supportTickets,
    setSupportTickets,
    createSupportTicket
  };
};
