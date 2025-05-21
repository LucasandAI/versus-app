
import { useCallback } from 'react';
import { ChatMessage } from '@/types/chat';
import { ChatStateData } from '@/types/chat-state';

export const useLocalStorage = () => {
  const loadFromStorage = useCallback(() => {
    const savedMessages = localStorage.getItem('chatMessages');
    const savedUnread = localStorage.getItem('unreadMessages');
    
    const messages = savedMessages ? JSON.parse(savedMessages) : {};
    const unreadMessages = savedUnread ? JSON.parse(savedUnread) : {};
    
    return {
      messages,
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

  return {
    loadFromStorage,
    saveMessages,
    saveUnreadMessages
  };
};
