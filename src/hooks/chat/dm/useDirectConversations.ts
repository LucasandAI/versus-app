
import { useState, useRef, useCallback } from 'react';
import { useApp } from '@/context/AppContext';
import { DMConversation } from './types';
import { useConversationsFetcher } from './useConversationsFetcher';

// Add default avatar constant
const DEFAULT_AVATAR = '/placeholder.svg';

export const useDirectConversations = (hiddenDMIds: string[] = []) => {
  const [conversations, setConversations] = useState<DMConversation[]>([]);
  const [loading, setLoading] = useState(false);
  const { currentUser, isSessionReady } = useApp();
  const fetchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isMounted = useRef(true);
  const hasFetchedRef = useRef(false);
  
  // Get the debounced fetch function
  const { debouncedFetchConversations } = useConversationsFetcher(isMounted);

  // Manual fetch function that will be called explicitly by components
  const fetchConversations = useCallback(() => {
    // Strong guard clause to prevent fetching without session or user
    if (!isSessionReady || !currentUser?.id) {
      console.log('[useDirectConversations] Session or user not ready, skipping fetch');
      return Promise.resolve([]);
    }

    // Only fetch if we haven't already (or if force refresh)
    if (hasFetchedRef.current) {
      console.log('[useDirectConversations] Already fetched, returning cached data');
      return Promise.resolve(conversations);
    }

    // Clear any existing timeout
    if (fetchTimeoutRef.current) {
      clearTimeout(fetchTimeoutRef.current);
    }

    // Set loading state
    setLoading(true);

    // Use a short timeout to ensure auth is fully ready
    return new Promise<DMConversation[]>((resolve) => {
      fetchTimeoutRef.current = setTimeout(() => {
        if (!isMounted.current) {
          setLoading(false);
          resolve([]);
          return;
        }

        console.log('[useDirectConversations] Session and user ready, fetching conversations');
        debouncedFetchConversations(currentUser.id, setLoading, (convs: DMConversation[]) => {
          // Filter out self-conversations
          const filteredConvs = convs.filter(c => c.userId !== currentUser.id);
          hasFetchedRef.current = true;
          setConversations(filteredConvs);
          setLoading(false);
          resolve(filteredConvs);
        });
      }, 300);
    });
  }, [currentUser?.id, isSessionReady, debouncedFetchConversations, conversations]);

  // Cleanup effect
  const cleanup = useCallback(() => {
    isMounted.current = false;
    if (fetchTimeoutRef.current) {
      clearTimeout(fetchTimeoutRef.current);
    }
    debouncedFetchConversations.cancel();
  }, [debouncedFetchConversations]);

  // Reset fetched state
  const resetFetchState = () => {
    hasFetchedRef.current = false;
  };

  // Filter out hidden conversations and self-conversations
  const filteredConversations = conversations.filter(
    conv => !hiddenDMIds.includes(conv.userId) && 
           !hiddenDMIds.includes(conv.conversationId) &&
           conv.userId !== currentUser?.id // Filter out self-conversations
  );

  return {
    conversations: filteredConversations,
    loading,
    fetchConversations,
    resetFetchState,
    cleanup
  };
};
