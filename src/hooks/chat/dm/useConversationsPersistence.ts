
import { DMConversation } from './types';
import { useApp } from '@/context/AppContext';
import { useCallback } from 'react';

export const useConversationsPersistence = () => {
  const { currentUser } = useApp();
  const BASE_STORAGE_KEY = 'direct_conversations';
  
  // Create a user-specific storage key to prevent session mixing
  const getStorageKey = useCallback(() => {
    return currentUser?.id 
      ? `${BASE_STORAGE_KEY}_${currentUser.id}` 
      : BASE_STORAGE_KEY;
  }, [currentUser?.id]);

  const loadConversationsFromStorage = useCallback(() => {
    try {
      const storedData = localStorage.getItem(getStorageKey());
      if (!storedData) return [];
      
      const parsed = JSON.parse(storedData);
      
      // Filter out any self-conversations that might have been stored
      if (currentUser?.id) {
        return parsed.filter((conv: DMConversation) => conv.userId !== currentUser.id);
      }
      
      return parsed;
    } catch (e) {
      console.error('Error loading conversations from storage:', e);
      return [];
    }
  }, [getStorageKey, currentUser?.id]);

  const saveConversationsToStorage = useCallback((conversations: DMConversation[]) => {
    try {
      // Filter out any self-conversations before saving
      const filtered = currentUser?.id
        ? conversations.filter(conv => conv.userId !== currentUser.id)
        : conversations;
        
      localStorage.setItem(getStorageKey(), JSON.stringify(filtered));
    } catch (e) {
      console.error('Error saving conversations to storage:', e);
    }
  }, [getStorageKey, currentUser?.id]);

  const clearConversationsFromStorage = useCallback(() => {
    try {
      localStorage.removeItem(getStorageKey());
    } catch (e) {
      console.error('Error clearing conversations from storage:', e);
    }
  }, [getStorageKey]);

  return {
    loadConversationsFromStorage,
    saveConversationsToStorage,
    clearConversationsFromStorage
  };
};
