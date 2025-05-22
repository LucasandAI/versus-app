
import { useCallback } from 'react';
import { ChatMessage } from '@/types/chat';
import { ChatStateData } from '@/types/chat-state';

// Define local storage keys
const MESSAGES_KEY = 'chatMessages';
const UNREAD_MESSAGES_KEY = 'unreadMessages';
const ACTIVE_CLUB_KEY = 'activeClub';
const ACTIVE_CONVERSATION_KEY = 'activeConversation';
const READ_TIMESTAMPS_KEY = 'readTimestamps';

export const useLocalStorage = () => {
  const loadFromStorage = useCallback(() => {
    const savedMessages = localStorage.getItem(MESSAGES_KEY);
    const savedUnread = localStorage.getItem(UNREAD_MESSAGES_KEY);
    const savedReadTimestamps = localStorage.getItem(READ_TIMESTAMPS_KEY);
    
    const messages = savedMessages ? JSON.parse(savedMessages) : {};
    const unreadMessages = savedUnread ? JSON.parse(savedUnread) : {};
    const readTimestamps = savedReadTimestamps ? JSON.parse(savedReadTimestamps) : {
      clubs: {},
      dms: {}
    };
    
    return {
      messages,
      unreadMessages,
      readTimestamps
    };
  }, []);

  const saveMessages = useCallback((messages: Record<string, ChatMessage[]>) => {
    localStorage.setItem(MESSAGES_KEY, JSON.stringify(messages));
  }, []);

  const saveUnreadMessages = useCallback((unreadMessages: Record<string, number>) => {
    localStorage.setItem(UNREAD_MESSAGES_KEY, JSON.stringify(unreadMessages));
    const event = new CustomEvent('unreadMessagesUpdated');
    window.dispatchEvent(event);
  }, []);

  const saveReadTimestamps = useCallback((timestamps: { clubs: Record<string, number>, dms: Record<string, number> }) => {
    localStorage.setItem(READ_TIMESTAMPS_KEY, JSON.stringify(timestamps));
    const event = new CustomEvent('readTimestampsUpdated');
    window.dispatchEvent(event);
  }, []);

  const getActiveClub = useCallback(() => {
    try {
      const active = localStorage.getItem(ACTIVE_CLUB_KEY);
      return active ? JSON.parse(active) : null;
    } catch (error) {
      console.error('[useLocalStorage] Error getting active club:', error);
      return null;
    }
  }, []);

  const setActiveClub = useCallback((clubId: string | null) => {
    try {
      if (clubId) {
        localStorage.setItem(ACTIVE_CLUB_KEY, JSON.stringify({
          id: clubId,
          timestamp: Date.now()
        }));
      } else {
        localStorage.removeItem(ACTIVE_CLUB_KEY);
      }
    } catch (error) {
      console.error('[useLocalStorage] Error setting active club:', error);
    }
  }, []);

  const getActiveConversation = useCallback(() => {
    try {
      const active = localStorage.getItem(ACTIVE_CONVERSATION_KEY);
      return active ? JSON.parse(active) : null;
    } catch (error) {
      console.error('[useLocalStorage] Error getting active conversation:', error);
      return null;
    }
  }, []);

  const setActiveConversation = useCallback((conversationId: string | null) => {
    try {
      if (conversationId) {
        localStorage.setItem(ACTIVE_CONVERSATION_KEY, JSON.stringify({
          id: conversationId,
          timestamp: Date.now()
        }));
      } else {
        localStorage.removeItem(ACTIVE_CONVERSATION_KEY);
      }
    } catch (error) {
      console.error('[useLocalStorage] Error setting active conversation:', error);
    }
  }, []);

  return {
    loadFromStorage,
    saveMessages,
    saveUnreadMessages,
    saveReadTimestamps,
    getActiveClub,
    setActiveClub,
    getActiveConversation,
    setActiveConversation
  };
};
