
import { useState, useCallback } from 'react';
import { useApp } from '@/context/AppContext';
import { SupportTicket } from '@/types/chat';

export const useSupportActions = () => {
  const { currentUser } = useApp();
  const [supportTickets, setSupportTickets] = useState<SupportTicket[]>([]);

  const handleCreateSupportTicket = useCallback((ticketId: string, subject: string, message: string) => {
    if (!currentUser) return;
    
    const newTicket: SupportTicket = {
      id: ticketId,
      subject,
      createdAt: new Date().toISOString(),
      status: 'open', // Adding the missing status property
      messages: [
        {
          id: Date.now().toString(),
          text: message,
          sender: {
            id: currentUser.id,
            name: currentUser.name,
            avatar: currentUser.avatar || '/placeholder.svg'
          },
          timestamp: new Date().toISOString(),
          isSupport: false
        },
        {
          id: 'support-' + Date.now() + '-response',
          text: `Thank you for contacting support about "${subject}". A support agent will review your request and respond shortly.`,
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
    
    setSupportTickets(prev => [...prev, newTicket]);
  }, [currentUser]);

  return {
    supportTickets,
    handleCreateSupportTicket
  };
};
