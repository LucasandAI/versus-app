
import { useCallback, useEffect } from 'react';
import type { DMConversation } from './types';

const VISIBLE_CONVERSATIONS_KEY = 'visibleConversations';

export const useConversationsPersistence = () => {
  const saveConversationsToStorage = useCallback((conversations: DMConversation[]) => {
    console.log('[useConversationsPersistence] Saving conversations to storage:', conversations.length);
    localStorage.setItem(VISIBLE_CONVERSATIONS_KEY, JSON.stringify(conversations));
  }, []);

  const loadConversationsFromStorage = useCallback((): DMConversation[] => {
    const stored = localStorage.getItem(VISIBLE_CONVERSATIONS_KEY);
    const conversations = stored ? JSON.parse(stored) : [];
    console.log('[useConversationsPersistence] Loaded conversations from storage:', conversations.length);
    return conversations;
  }, []);

  return {
    saveConversationsToStorage,
    loadConversationsFromStorage
  };
};
