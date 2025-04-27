
import { useState, useCallback, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { useUserData } from './useUserData';
import { useRealtimeSubscriptions } from './useRealtimeSubscriptions';
import { useFetchConversations } from './useFetchConversations';
import { useConversationsPersistence } from './useConversationsPersistence';
import type { DMConversation } from './types';

export type { DMConversation };

export const useConversations = (hiddenDMs: string[]) => {
  const [allConversations, setAllConversations] = useState<DMConversation[]>([]);
  const [visibleConversations, setVisibleConversations] = useState<DMConversation[]>([]);
  const { currentUser } = useApp();
  const { userCache, setUserCache, fetchUserData } = useUserData();
  const fetchConversations = useFetchConversations(currentUser?.id);
  const { saveConversationsToStorage, loadConversationsFromStorage } = useConversationsPersistence();

  // Load initial conversations from storage
  useEffect(() => {
    const storedConversations = loadConversationsFromStorage();
    if (storedConversations.length > 0) {
      console.log('[useConversations] Initializing with stored conversations:', storedConversations.length);
      setAllConversations(storedConversations);
    }
  }, [loadConversationsFromStorage]);

  // Persist conversations to storage
  useEffect(() => {
    if (allConversations.length > 0) {
      console.log('[useConversations] Saving updated conversations:', allConversations.length);
      saveConversationsToStorage(allConversations);
    }
  }, [allConversations, saveConversationsToStorage]);

  // Recompute visible conversations whenever allConversations or hiddenDMs change
  useEffect(() => {
    console.log('[useConversations] Filtering visible conversations. Total:', allConversations.length, 'Hidden:', hiddenDMs.length);
    setVisibleConversations(
      allConversations.filter(conv => !hiddenDMs.includes(conv.userId))
    );
  }, [allConversations, hiddenDMs]);

  const updateConversation = useCallback((otherUserId: string, newMessage: string, otherUserName?: string, otherUserAvatar?: string) => {
    console.log('[updateConversation] Updating conversation for userId:', otherUserId, 'with message:', newMessage);
    
    setAllConversations(prevConversations => {
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

  return { 
    conversations: visibleConversations,
    updateConversation
  };
};
