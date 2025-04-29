
import React, { useState, useCallback } from 'react';
import DirectConversationsContext from './DirectConversationsContext';
import { Conversation } from './types';
import { useApp } from '@/context/AppContext';
import { useFetchConversations } from './useFetchConversations';
import { useConversationManagement } from './useConversationManagement';

export const DirectConversationsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const { currentUser } = useApp();
  
  const fetchConversationsFunc = useFetchConversations(currentUser?.id);
  const { getOrCreateConversation } = useConversationManagement(currentUser?.id);
  
  const fetchConversations = useCallback(async (forceRefresh = false) => {
    if (!forceRefresh && hasLoaded) {
      console.log('[DirectConversationsProvider] Using cached conversations');
      return;
    }
    
    if (!currentUser?.id) {
      console.warn('[DirectConversationsProvider] Cannot fetch conversations, no current user');
      return;
    }
    
    setLoading(true);
    
    try {
      const conversationsData = await fetchConversationsFunc();
      setConversations(conversationsData);
      setHasLoaded(true);
    } catch (error) {
      console.error('[DirectConversationsProvider] Error in fetchConversations:', error);
    } finally {
      setLoading(false);
    }
  }, [currentUser?.id, hasLoaded, fetchConversationsFunc]);
  
  const refreshConversations = useCallback(async () => {
    await fetchConversations(true);
  }, [fetchConversations]);
  
  const getOrCreateConversationWithUpdate = useCallback(async (
    userId: string, 
    userName: string, 
    userAvatar = '/placeholder.svg'
  ): Promise<Conversation | null> => {
    if (!currentUser?.id) {
      console.warn('[DirectConversationsProvider] Cannot get conversation, no current user');
      return null;
    }
    
    try {
      // Check if we already have this conversation in our local state
      const existingConversation = conversations.find(c => c.userId === userId);
      if (existingConversation) {
        return existingConversation;
      }
      
      const conversation = await getOrCreateConversation(userId, userName, userAvatar);
      
      if (conversation) {
        // Update local state
        setConversations(prev => {
          // Don't add duplicate
          if (prev.some(c => c.conversationId === conversation.conversationId)) {
            return prev;
          }
          return [conversation, ...prev];
        });
      }
      
      return conversation;
      
    } catch (error) {
      console.error('[DirectConversationsProvider] Error in getOrCreateConversationWithUpdate:', error);
      return null;
    }
  }, [currentUser?.id, conversations, getOrCreateConversation]);
  
  const contextValue = {
    conversations,
    loading,
    hasLoaded,
    fetchConversations,
    refreshConversations,
    getOrCreateConversation: getOrCreateConversationWithUpdate
  };
  
  return (
    <DirectConversationsContext.Provider value={contextValue}>
      {children}
    </DirectConversationsContext.Provider>
  );
};
