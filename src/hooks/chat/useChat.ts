
import { useState, useEffect, useCallback } from 'react';
import { useLocalStorage } from './useLocalStorage';
import { useMessages } from './useMessages';
import { ChatStateData } from '@/types/chat-state';

export const useChat = (open: boolean, onNewMessage?: (count: number) => void) => {
  const [unreadMessages, setUnreadMessages] = useState<Record<string, number>>({});
  const [refreshKey, setRefreshKey] = useState(Date.now());
  const [supportTickets, setSupportTickets] = useState<Record<string, any>>({});
  
  const {
    loadFromStorage,
    saveMessages,
    saveUnreadMessages,
    saveSupportTickets
  } = useLocalStorage();

  const updateUnreadCount = useCallback((chatId: string, increment: number) => {
    setUnreadMessages(prev => {
      const updated = { 
        ...prev, 
        [chatId]: (prev[chatId] || 0) + increment 
      };
      saveUnreadMessages(updated);
      return updated;
    });
  }, [saveUnreadMessages]);

  const { messages, setMessages, handleNewMessage } = useMessages(
    saveMessages,
    updateUnreadCount
  );

  const createSupportTicket = useCallback((ticketId: string, subject: string, message: string, userId: string, userName: string, userAvatar?: string) => {
    const newTicket = {
      id: ticketId,
      subject: subject,
      createdAt: new Date().toISOString(),
      messages: [
        {
          id: Date.now().toString(),
          text: message,
          sender: {
            id: userId,
            name: userName,
            avatar: userAvatar || '/placeholder.svg'
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
    
    setSupportTickets(prev => {
      const updated = { ...prev, [ticketId]: newTicket };
      saveSupportTickets(updated);
      return updated;
    });
    
    updateUnreadCount(ticketId, 1);
    
    return newTicket;
  }, [saveSupportTickets, updateUnreadCount]);

  // Load data from localStorage on mount
  useEffect(() => {
    const loadDataFromStorage = () => {
      const data = loadFromStorage();
      setMessages(data.messages);
      setSupportTickets(data.supportTickets);
      setUnreadMessages(data.unreadMessages);
    };
    
    loadDataFromStorage();
    
    const handleFocus = () => loadDataFromStorage();
    const handleNotificationsUpdated = () => {
      loadDataFromStorage();
      setRefreshKey(Date.now());
    };
    
    window.addEventListener('focus', handleFocus);
    window.addEventListener('notificationsUpdated', handleNotificationsUpdated);
    window.addEventListener('supportTicketCreated', handleNotificationsUpdated);
    
    return () => {
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('notificationsUpdated', handleNotificationsUpdated);
      window.removeEventListener('supportTicketCreated', handleNotificationsUpdated);
    };
  }, [loadFromStorage, setMessages]);

  // Update notification count when unread messages change
  useEffect(() => {
    if (onNewMessage) {
      const totalUnread = Object.values(unreadMessages).reduce(
        (sum: number, count: unknown) => sum + (typeof count === 'number' ? count : 0),
        0
      );
      onNewMessage(totalUnread);
    }
  }, [unreadMessages, onNewMessage]);

  // Reset notification count when drawer is open
  useEffect(() => {
    if (open) {
      setRefreshKey(Date.now());
      const savedUnread = localStorage.getItem('unreadMessages');
      if (savedUnread) {
        setUnreadMessages(JSON.parse(savedUnread));
      }
    }
  }, [open]);

  const markTicketAsRead = useCallback((ticketId: string) => {
    setUnreadMessages(prev => {
      const updated = { ...prev, [ticketId]: 0 };
      saveUnreadMessages(updated);
      return updated;
    });
  }, [saveUnreadMessages]);

  const deleteChat = useCallback((chatId: string, isTicket: boolean = false) => {
    if (isTicket) {
      setSupportTickets(prev => {
        const updated = { ...prev };
        delete updated[chatId];
        saveSupportTickets(updated);
        return updated;
      });
    } else {
      setMessages(prev => {
        const updated = { ...prev };
        delete updated[chatId];
        saveMessages(updated);
        return updated;
      });
    }
    
    setUnreadMessages(prev => {
      const updated = { ...prev };
      delete updated[chatId];
      saveUnreadMessages(updated);
      return updated;
    });
    
    setRefreshKey(Date.now());
  }, [saveMessages, saveSupportTickets, saveUnreadMessages]);

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
