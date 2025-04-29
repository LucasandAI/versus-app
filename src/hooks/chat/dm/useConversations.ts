
import { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { useFetchConversations } from './useFetchConversations';
import { DMConversation } from './types';

// Wrapper around fetchConversations logic to provide a clean API
export const useConversations = (hiddenDMIds: string[] = []) => {
  const [conversations, setConversations] = useState<DMConversation[]>([]);
  const [loading, setLoading] = useState(true);
  const { currentUser, isSessionReady } = useApp();
  
  // fetchConversations is a callback that triggers the actual fetch
  const fetchConversations = useFetchConversations(currentUser?.id);
  
  // Fetch conversations whenever currentUser or isSessionReady changes
  useEffect(() => {
    let isMounted = true;
    
    const loadConversations = async () => {
      // Strong guard against missing user ID or inactive session
      if (!currentUser?.id || !isSessionReady) {
        console.log('[useConversations] User ID or session not ready, skipping fetch');
        return;
      }
      
      setLoading(true);
      try {
        console.log('[useConversations] Fetching conversations for user:', currentUser.id);
        const result = await fetchConversations();
        if (isMounted) {
          // Filter out any self-conversations where userId might equal currentUser.id
          const filteredResults = result?.filter(conv => conv.userId !== currentUser.id) || [];
          setConversations(filteredResults);
        }
      } catch (error) {
        console.error('[useConversations] Error fetching conversations:', error);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    // Only load if we have both user ID and session ready
    if (currentUser?.id && isSessionReady) {
      loadConversations();
    }
    
    return () => {
      isMounted = false;
    };
  }, [currentUser?.id, isSessionReady, fetchConversations]);

  return {
    conversations: conversations.filter(
      c => !hiddenDMIds.includes(c.userId) && !hiddenDMIds.includes(c.conversationId)
    ),
    loading,
    fetchConversations: async () => {
      // Ensure we have user and session before fetching
      if (!currentUser?.id || !isSessionReady) {
        console.log('[useConversations] fetchConversations called but user or session not ready');
        return [];
      }
      
      setLoading(true);
      try {
        const result = await fetchConversations();
        // Filter out self-conversations
        const filteredResults = result?.filter(conv => conv.userId !== currentUser.id) || [];
        setConversations(filteredResults);
        return filteredResults;
      } finally {
        setLoading(false);
      }
    }
  };
};
