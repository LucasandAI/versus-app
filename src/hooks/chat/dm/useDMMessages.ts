
import { useState, useEffect, useRef } from 'react';
import { ChatMessage } from '@/types/chat';
import { useMessageDeduplication } from './useMessageDeduplication';
import { useMessageFetching } from './useMessageFetching';
import { findMatchingMessage } from './utils/messageUtils';
import { useApp } from '@/context/AppContext';

export const useDMMessages = (userId: string, userName: string, conversationId: string) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const { isSessionReady, currentUser } = useApp();
  const isMounted = useRef(true);
  const conversationIdRef = useRef(conversationId);
  const hasFetchedRef = useRef(false);
  const fetchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const fetchInProgressRef = useRef(false);

  const { messageIds, addMessagesWithoutDuplicates, clearMessageIds } = useMessageDeduplication();
  const { fetchMessages } = useMessageFetching(userId, userName, conversationId, currentUser);

  // Update ref when conversation ID changes and reset fetch state
  useEffect(() => {
    conversationIdRef.current = conversationId;
    hasFetchedRef.current = false; // Reset fetch flag when conversation changes
  }, [conversationId]);

  // Clean up on unmount
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current);
      }
      clearMessageIds();
    };
  }, [clearMessageIds]);

  // Fetch messages when conversation details change
  useEffect(() => {
    // Clear any existing timeout
    if (fetchTimeoutRef.current) {
      clearTimeout(fetchTimeoutRef.current);
    }

    // Skip if already fetching or already fetched for this conversation
    if (fetchInProgressRef.current || hasFetchedRef.current) {
      return;
    }

    // Skip if not ready with session, user, or conversationId
    if (!isSessionReady || !currentUser?.id || !conversationId || conversationId === 'new') {
      setLoading(false);
      return;
    }

    // Mark as fetching to prevent duplicate fetches
    fetchInProgressRef.current = true;
    setLoading(true);
    
    fetchTimeoutRef.current = setTimeout(async () => {
      try {
        if (!isMounted.current) return;
        
        console.log('[useDMMessages] Fetching messages for conversation:', conversationId);
        const fetchedMessages = await fetchMessages();
        
        if (isMounted.current) {
          setMessages(prev => addMessagesWithoutDuplicates(prev, fetchedMessages));
          hasFetchedRef.current = true;
        }
      } catch (error) {
        console.error('[useDMMessages] Error fetching messages:', error);
      } finally {
        if (isMounted.current) {
          setLoading(false);
          fetchInProgressRef.current = false;
        }
      }
    }, 300); // Add a delay to prevent race conditions
  }, [userId, conversationId, fetchMessages, isSessionReady, currentUser?.id, addMessagesWithoutDuplicates]);

  const addMessage = (message: ChatMessage): boolean => {
    const existingMessage = findMatchingMessage(messages, message);
    if (!existingMessage) {
      setMessages(prev => [...prev, message]);
      return true;
    }
    return false;
  };

  const deleteMessage = (messageId: string) => {
    setMessages(prev => prev.filter(msg => msg.id !== messageId));
  };

  const refreshMessages = async () => {
    // Skip if already fetching
    if (fetchInProgressRef.current) {
      return;
    }

    // Only run if session is ready, user is authenticated, and we have a valid conversation ID
    if (!isSessionReady || !currentUser?.id || !conversationId || conversationId === 'new') {
      console.log('[refreshMessages] Skipping refresh - session or conversation not ready');
      return;
    }
    
    try {
      fetchInProgressRef.current = true;
      console.log('[refreshMessages] Refreshing messages for conversation:', conversationId);
      const fetchedMessages = await fetchMessages();
      if (isMounted.current) {
        setMessages(prev => addMessagesWithoutDuplicates(prev, fetchedMessages));
        hasFetchedRef.current = true;
      }
    } catch (error) {
      // Prevent error propagation to avoid infinite toasts
      console.error('[refreshMessages] Error refreshing messages:', error);
    } finally {
      fetchInProgressRef.current = false;
    }
  };

  // Enable manually resetting the fetched state
  const resetFetchState = () => {
    hasFetchedRef.current = false;
  };

  return {
    messages,
    setMessages,
    addMessage,
    loading,
    isSending,
    setIsSending,
    refreshMessages,
    deleteMessage,
    resetFetchState
  };
};

export default useDMMessages;
