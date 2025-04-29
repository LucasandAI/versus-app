
import { useState, useRef } from 'react';
import { useApp } from '@/context/AppContext';
import { useFetchConversations } from './useFetchConversations';
import { DMConversation } from './types';

// Wrapper around fetchConversations logic to provide a clean API
export const useConversations = (hiddenDMIds: string[] = []) => {
  const [conversations, setConversations] = useState<DMConversation[]>([]);
  const [loading, setLoading] = useState(false);
  const { currentUser, isSessionReady } = useApp();
  const hasFetchedRef = useRef(false);
  const isMounted = useRef(true);
  
  // fetchConversations is a callback that triggers the actual fetch
  const fetchConversationsCallback = useFetchConversations(currentUser?.id);
  
  // Cleanup effect function
  const cleanup = () => {
    isMounted.current = false;
  };

  // Manual fetch function that will be called explicitly
  const fetchConversations = async () => {
    // Skip if session or user is not ready
    if (!currentUser?.id || !isSessionReady) {
      console.log('[useConversations] User ID or session not ready, skipping fetch');
      return [];
    }
    
    // Skip if we've already fetched, unless it's a forced refresh
    if (hasFetchedRef.current) {
      console.log('[useConversations] Already fetched, returning cached data');
      return conversations;
    }
    
    setLoading(true);
    try {
      console.log('[useConversations] Fetching conversations for user:', currentUser.id);
      const result = await fetchConversationsCallback();
      
      if (isMounted.current) {
        // Filter out any self-conversations where userId might equal currentUser.id
        const filteredResults = result?.filter(conv => conv.userId !== currentUser.id) || [];
        setConversations(filteredResults);
        hasFetchedRef.current = true;
        return filteredResults;
      }
      return [];
    } catch (error) {
      console.error('[useConversations] Error fetching conversations:', error);
      return [];
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  };

  // Function to reset fetch state for forced refreshes
  const resetFetchState = () => {
    hasFetchedRef.current = false;
  };

  return {
    conversations: conversations.filter(
      c => !hiddenDMIds.includes(c.userId) && !hiddenDMIds.includes(c.conversationId) && c.userId !== currentUser?.id
    ),
    loading,
    fetchConversations,
    resetFetchState,
    cleanup
  };
};
