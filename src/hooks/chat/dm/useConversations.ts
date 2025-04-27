
import { useState, useCallback, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { useUserData } from './useUserData';
import { useRealtimeSubscriptions } from './useRealtimeSubscriptions';
import { useFetchConversations } from './useFetchConversations';
import { useConversationsPersistence } from './useConversationsPersistence';
import type { DMConversation } from './types';

export type { DMConversation };

export const useConversations = (hiddenDMs: string[]) => {
  const [conversations, setConversations] = useState<DMConversation[]>([]);
  const { currentUser } = useApp();
  const { userCache, setUserCache, fetchUserData } = useUserData();
  const fetchConversations = useFetchConversations(currentUser?.id);
  const { saveConversationsToStorage, loadConversationsFromStorage } = useConversationsPersistence();

  // Load persisted conversations on mount
  useEffect(() => {
    const storedConversations = loadConversationsFromStorage();
    if (storedConversations.length > 0) {
      console.log('[useConversations] Initializing with stored conversations:', storedConversations.length);
      setConversations(storedConversations);
    }
  }, [loadConversationsFromStorage]);

  // Save conversations whenever they change
  useEffect(() => {
    if (conversations.length > 0) {
      console.log('[useConversations] Saving updated conversations:', conversations.length);
      saveConversationsToStorage(conversations);
    }
  }, [conversations, saveConversationsToStorage]);

  const updateConversation = useCallback((otherUserId: string, newMessage: string, otherUserName?: string, otherUserAvatar?: string) => {
    console.log('[updateConversation] Updating conversation for userId:', otherUserId, 'with message:', newMessage);
    
    setConversations(prevConversations => {
      const now = new Date().toISOString();
      const existingConvIndex = prevConversations.findIndex(
        conv => conv.userId === otherUserId
      );

      if (otherUserName) {
        setUserCache(prev => ({
          ...prev,
          [otherUserId]: { name: otherUserName, avatar: otherUserAvatar }
        }));
      }

      let updatedConversations = [...prevConversations];
      
      if (existingConvIndex >= 0) {
        // Update existing conversation
        const existingConv = { ...updatedConversations[existingConvIndex] };
        updatedConversations.splice(existingConvIndex, 1);
        updatedConversations.unshift({
          ...existingConv,
          lastMessage: newMessage,
          timestamp: now,
          ...(otherUserName && { userName: otherUserName }),
          ...(otherUserAvatar && { userAvatar: otherUserAvatar })
        });
      } else if (otherUserName) {
        // Create new conversation
        updatedConversations.unshift({
          userId: otherUserId,
          userName: otherUserName,
          userAvatar: otherUserAvatar,
          lastMessage: newMessage,
          timestamp: now
        });
      }

      return updatedConversations;
    });
  }, [setUserCache]);

  // Set up realtime subscriptions
  useRealtimeSubscriptions(currentUser?.id, userCache, fetchUserData, updateConversation);

  // Calculate visible conversations as a derived state
  // This will be recalculated whenever conversations OR hiddenDMs change
  const visibleConversations = conversations.filter(
    conv => !hiddenDMs.includes(conv.userId)
  );

  return { 
    conversations: visibleConversations, // Return filtered conversations
    updateConversation
  };
};
