
import { useCallback } from 'react';
import { ChatMessage } from '@/types/chat';
import { ChatStateData } from '@/types/chat-state';

export const useLocalStorage = () => {
  const loadFromStorage = useCallback(() => {
    try {
      const savedMessages = localStorage.getItem('chatMessages');
      const savedUnread = localStorage.getItem('unreadMessages');
      
      const messages = savedMessages ? JSON.parse(savedMessages) : {};
      const unreadMessages = savedUnread ? JSON.parse(savedUnread) : {};
      
      return {
        messages,
        unreadMessages
      };
    } catch (error) {
      console.error('[useLocalStorage] Error loading from storage:', error);
      return {
        messages: {},
        unreadMessages: {}
      };
    }
  }, []);

  const saveMessages = useCallback((messages: Record<string, ChatMessage[]>) => {
    try {
      localStorage.setItem('chatMessages', JSON.stringify(messages));
    } catch (error) {
      console.error('[useLocalStorage] Error saving messages to storage:', error);
    }
  }, []);

  const saveUnreadMessages = useCallback((unreadMessages: Record<string, number>) => {
    try {
      localStorage.setItem('unreadMessages', JSON.stringify(unreadMessages));
      const event = new CustomEvent('unreadMessagesUpdated');
      window.dispatchEvent(event);
    } catch (error) {
      console.error('[useLocalStorage] Error saving unread messages to storage:', error);
    }
  }, []);

  // Add a new utility method to support our enhanced local-first approach
  const saveReadTimestamp = useCallback((type: 'club' | 'dm', id: string, timestamp: string) => {
    try {
      const storageKey = type === 'club' ? 'club_read_times' : 'dm_read_times';
      const existing = localStorage.getItem(storageKey);
      const timestamps = existing ? JSON.parse(existing) : {};
      
      timestamps[id] = timestamp;
      localStorage.setItem(storageKey, JSON.stringify(timestamps));
      
      return true;
    } catch (error) {
      console.error(`[useLocalStorage] Error saving ${type} read timestamp:`, error);
      return false;
    }
  }, []);

  // Add a method to get the last read timestamp
  const getReadTimestamp = useCallback((type: 'club' | 'dm', id: string): string | null => {
    try {
      const storageKey = type === 'club' ? 'club_read_times' : 'dm_read_times';
      const existing = localStorage.getItem(storageKey);
      if (!existing) return null;
      
      const timestamps = JSON.parse(existing);
      return timestamps[id] || null;
    } catch (error) {
      console.error(`[useLocalStorage] Error getting ${type} read timestamp:`, error);
      return null;
    }
  }, []);

  return {
    loadFromStorage,
    saveMessages,
    saveUnreadMessages,
    saveReadTimestamp,
    getReadTimestamp
  };
};
