
import { useState, useEffect } from 'react';
import { ChatMessage, ChatState, SupportTicket } from '@/types/chat';
import { Club } from '@/types';

export const useChat = (open: boolean, onNewMessage?: (count: number) => void) => {
  const [messages, setMessages] = useState<Record<string, ChatMessage[]>>({});
  const [supportTickets, setSupportTickets] = useState<Record<string, SupportTicket>>({});
  const [unreadMessages, setUnreadMessages] = useState<Record<string, number>>({});
  const [refreshKey, setRefreshKey] = useState(Date.now());

  // Load messages and tickets from localStorage on mount
  useEffect(() => {
    const savedMessages = localStorage.getItem('chatMessages');
    if (savedMessages) {
      setMessages(JSON.parse(savedMessages));
    }
    
    const savedTickets = localStorage.getItem('supportTickets');
    if (savedTickets) {
      const tickets: SupportTicket[] = JSON.parse(savedTickets);
      const ticketsRecord: Record<string, SupportTicket> = {};
      tickets.forEach(ticket => {
        ticketsRecord[ticket.id] = ticket;
      });
      setSupportTickets(ticketsRecord);
    }
    
    const savedUnread = localStorage.getItem('unreadMessages');
    if (savedUnread) {
      setUnreadMessages(JSON.parse(savedUnread));
    }
  }, [refreshKey]); // Added refreshKey as a dependency to reload when it changes

  // Save to localStorage whenever data changes
  useEffect(() => {
    localStorage.setItem('chatMessages', JSON.stringify(messages));
  }, [messages]);
  
  useEffect(() => {
    localStorage.setItem('unreadMessages', JSON.stringify(unreadMessages));
  }, [unreadMessages]);

  useEffect(() => {
    if (open) {
      setRefreshKey(Date.now());
      if (onNewMessage) {
        onNewMessage(0);
      }
    }
  }, [open, onNewMessage]);

  // Update notification count whenever unreadMessages changes
  useEffect(() => {
    if (!open && onNewMessage) {
      const totalUnread = Object.values(unreadMessages).reduce((sum, count) => sum + count, 0);
      onNewMessage(totalUnread);
    }
  }, [unreadMessages, open, onNewMessage]);

  // Check for new support tickets on component mount and when they change
  useEffect(() => {
    const checkForNewSupportTickets = () => {
      const savedTickets = localStorage.getItem('supportTickets');
      if (!savedTickets) return;
      
      const tickets: SupportTicket[] = JSON.parse(savedTickets);
      const currentTicketIds = Object.keys(supportTickets);
      
      tickets.forEach(ticket => {
        // If this is a new ticket that we don't have in our state
        if (!currentTicketIds.includes(ticket.id)) {
          // Update unread messages for new tickets
          setUnreadMessages(prev => ({
            ...prev,
            [ticket.id]: 1 // Set at least 1 unread message for the auto-response
          }));
        }
      });
    };
    
    checkForNewSupportTickets();
  }, [supportTickets]);

  const handleNewMessage = (clubId: string, message: ChatMessage, isOpen: boolean) => {
    setMessages(prev => ({
      ...prev,
      [clubId]: [...(prev[clubId] || []), message]
    }));

    if (!isOpen) {
      setUnreadMessages(prev => ({
        ...prev,
        [clubId]: (prev[clubId] || 0) + 1
      }));
    }
    
    // Save to localStorage
    const updatedMessages = {
      ...messages,
      [clubId]: [...(messages[clubId] || []), message]
    };
    localStorage.setItem('chatMessages', JSON.stringify(updatedMessages));
  };

  const createSupportTicket = (ticketId: string, subject: string, message: string, userId: string, userName: string, userAvatar?: string) => {
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

    // Auto-response from support
    const supportResponse: ChatMessage = {
      id: 'support-' + Date.now(),
      text: `Thank you for contacting support about "${subject}". A support agent will review your request and respond shortly.`,
      sender: {
        id: 'support',
        name: 'Support Team',
        avatar: '/placeholder.svg'
      },
      timestamp: new Date(Date.now() + 1000).toISOString(), // 1 second later
      isSupport: true
    };

    const ticket: SupportTicket = {
      id: ticketId,
      subject,
      createdAt: timestamp,
      messages: [newMessage, supportResponse]
    };

    setSupportTickets(prev => ({
      ...prev,
      [ticketId]: ticket
    }));

    // Add unread count for support tickets (always add 1 for the auto-response)
    setUnreadMessages(prev => ({
      ...prev,
      [ticketId]: 1
    }));
    
    // Save to localStorage - both as record and as array
    const updatedTickets = {
      ...supportTickets,
      [ticketId]: ticket
    };
    
    // Save as record for internal use
    localStorage.setItem('supportTicketsRecord', JSON.stringify(updatedTickets));
    
    // Save as array for external components
    const ticketsArray = Object.values(updatedTickets);
    localStorage.setItem('supportTickets', JSON.stringify(ticketsArray));
    
    // Notify the chat icon about the new unread message
    if (onNewMessage && !open) {
      const totalUnread = Object.values({...unreadMessages, [ticketId]: 1}).reduce((sum, count) => sum + count, 0);
      onNewMessage(totalUnread);
    }
    
    // Force a refresh to ensure the new ticket appears in the list
    setRefreshKey(Date.now());
  };

  return {
    messages,
    supportTickets,
    unreadMessages,
    refreshKey,
    handleNewMessage,
    createSupportTicket,
    setUnreadMessages
  };
};

export type ChatHookReturn = ReturnType<typeof useChat>;
