
import { useState, useEffect, useRef, useCallback } from 'react';
import { useApp } from '@/context/AppContext';
import { DMConversation } from './types';
import { useConversationsFetcher } from './useConversationsFetcher';

// Add default avatar constant
const DEFAULT_AVATAR = '/placeholder.svg';

export const useDirectConversations = (hiddenDMIds: string[] = []) => {
  const [conversations, setConversations] = useState<DMConversation[]>([]);
  const [loading, setLoading] = useState(true);
  const { currentUser, isSessionReady } = useApp();
  const attemptedFetch = useRef(false);
  const isMounted = useRef(true);
  
  // Get the debounced fetch function
  const { debouncedFetchConversations } = useConversationsFetcher(isMounted);

  const fetchConversations = useCallback(() => {
    // Strong guard clause to prevent fetching without session or user
    if (!isSessionReady || !currentUser?.id) {
      console.log('[useDirectConversations] Session or user not ready, skipping fetch');
      return Promise.resolve([]);
    }

    console.log('[useDirectConversations] Session and user ready, fetching conversations');
    attemptedFetch.current = true;
    return debouncedFetchConversations(currentUser.id, setLoading, setConversations);
  }, [currentUser?.id, isSessionReady, debouncedFetchConversations]);

  // Cleanup effect
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
      debouncedFetchConversations.cancel();
    };
  }, [debouncedFetchConversations]);

  // Only attempt fetch when both session is ready AND user ID exists
  useEffect(() => {
    const shouldFetch = isSessionReady && 
                        currentUser?.id && 
                        !attemptedFetch.current;
                        
    if (shouldFetch) {
      console.log('[useDirectConversations] Session AND user ready, triggering fetch');
      // Add a small delay to ensure auth is fully ready
      setTimeout(() => {
        if (isMounted.current) {
          fetchConversations();
        }
      }, 300);
    }
  }, [isSessionReady, currentUser?.id, fetchConversations]);

  // Filter out hidden conversations
  const filteredConversations = conversations.filter(
    conv => !hiddenDMIds.includes(conv.userId) && !hiddenDMIds.includes(conv.conversationId)
  );

  return {
    conversations: filteredConversations,
    loading,
    fetchConversations
  };
};
