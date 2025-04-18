
import { useState, useEffect, useCallback } from 'react';
import { ChatMessage, ChatState, SupportTicket } from '@/types/chat';
import { Club } from '@/types';

export const useChat = (open: boolean, onNewMessage?: (count: number) => void) => {
  const [messages, setMessages] = useState<Record<string, ChatMessage[]>>({});
  const [supportTickets, setSupportTickets] = useState<Record<string, SupportTicket>>({});
  const [unreadMessages, setUnreadMessages] = useState<Record<string, number>>({});
  const [refreshKey, setRefreshKey] = useState(Date.now());

  // Load messages and tickets from localStorage on mount
  useEffect(() => {
    const loadDataFromStorage = () => {
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
    };
    
    loadDataFromStorage();
    
    // Also set up an event listener to reload data when focus returns to the window
    const handleFocus = () => {
      loadDataFromStorage();
    };
    
    window.addEventListener('focus', handleFocus);
    
    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, [refreshKey]); // Added refreshKey as a dependency to reload when it changes

  // Save to localStorage whenever messages change
  useEffect(() => {
    localStorage.setItem('chatMessages', JSON.stringify(messages));
  }, [messages]);
  
  // Update localStorage and dispatch event when unread messages change
  useEffect(() => {
    localStorage.setItem('unreadMessages', JSON.stringify(unreadMessages));
    
    // Dispatch custom event so other components can listen for changes
    const event = new CustomEvent('unreadMessagesUpdated');
    window.dispatchEvent(event);
    
    // Also update the notification count using callback if provided
    if (onNewMessage) {
      const totalUnread = Object.values(unreadMessages).reduce(
        (sum: number, count: unknown) => sum + (typeof count === 'number' ? count : 0), 
        0
      );
      onNewMessage(Number(totalUnread));
    }
  }, [unreadMessages, onNewMessage]);

  // Reset notification count when the drawer is open
  useEffect(() => {
    if (open) {
      setRefreshKey(Date.now());
      
      // When chat is opened, make sure we have the latest data
      const savedUnread = localStorage.getItem('unreadMessages');
      if (savedUnread) {
        setUnreadMessages(JSON.parse(savedUnread));
      }
    }
  }, [open]);

  // Handle new messages
  const handleNewMessage = (clubId: string, message: ChatMessage, isOpen: boolean) => {
    // Update messages state
    setMessages(prev => {
      const updatedMessages = {
        ...prev,
        [clubId]: [...(prev[clubId] || []), message]
      };
      
      // Save to localStorage
      localStorage.setItem('chatMessages', JSON.stringify(updatedMessages));
      
      return updatedMessages;
    });

    // If drawer is not open, increment unread count
    if (!isOpen) {
      setUnreadMessages(prev => {
        const updated = { ...prev, [clubId]: (prev[clubId] || 0) + 1 };
        localStorage.setItem('unreadMessages', JSON.stringify(updated));
        return updated;
      });
    }
    
    // Dispatch event to notify about changes
    const event = new CustomEvent('unreadMessagesUpdated');
    window.dispatchEvent(event);
  };

  // Make markTicketAsRead a memoized callback
  const markTicketAsRead = useCallback((ticketId: string) => {
    setUnreadMessages(prev => {
      const updated = { ...prev, [ticketId]: 0 };
      // Save to localStorage immediately
      localStorage.setItem('unreadMessages', JSON.stringify(updated));
      
      // Dispatch event to notify about changes
      const event = new CustomEvent('unreadMessagesUpdated');
      window.dispatchEvent(event);
      
      return updated;
    });
  }, []);

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
      // Fix TypeScript error: Ensure proper type handling for the reduce operation
      const totalUnread = Object.values({...unreadMessages, [ticketId]: 1}).reduce((sum: number, count: unknown) => 
        sum + (typeof count === 'number' ? count : 0), 0);
      onNewMessage(totalUnread);
    }
    
    // Force a refresh to ensure the new ticket appears in the list
    setRefreshKey(Date.now());
  };

  // Add the ability to delete a chat or support ticket
  const deleteChat = (chatId: string, isTicket: boolean = false) => {
    if (isTicket) {
      // Delete a support ticket
      setSupportTickets(prev => {
        const updated = { ...prev };
        delete updated[chatId];
        
        // Update the localStorage
        const ticketsArray = Object.values(updated);
        localStorage.setItem('supportTickets', JSON.stringify(ticketsArray));
        localStorage.setItem('supportTicketsRecord', JSON.stringify(updated));
        
        return updated;
      });
    } else {
      // Delete club messages
      setMessages(prev => {
        const updated = { ...prev };
        delete updated[chatId];
        
        // Save to localStorage
        localStorage.setItem('chatMessages', JSON.stringify(updated));
        
        return updated;
      });
    }
    
    // Also clear any unread counts for this chat
    setUnreadMessages(prev => {
      const updated = { ...prev };
      delete updated[chatId];
      localStorage.setItem('unreadMessages', JSON.stringify(updated));
      return updated;
    });
    
    // Trigger UI refresh
    setRefreshKey(Date.now());
    
    // Dispatch event to notify about changes
    const event = new CustomEvent('unreadMessagesUpdated');
    window.dispatchEvent(event);
  };

  return {
    messages,
    supportTickets,
    unreadMessages,
    refreshKey,
    handleNewMessage,
    createSupportTicket,
    setUnreadMessages,
    markTicketAsRead,
    deleteChat
  };
};

export type ChatHookReturn = ReturnType<typeof useChat>;
