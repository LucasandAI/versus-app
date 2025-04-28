
import { useState, useEffect, useRef } from 'react';
import { ChatMessage } from '@/types/chat';
import { useMessageDeduplication } from './useMessageDeduplication';
import { useMessageFetching } from './useMessageFetching';
import { findMatchingMessage } from './utils/messageUtils';
import { useApp } from '@/context/AppContext';

export const useDMMessages = (userId: string, userName: string, conversationId: string) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const { isSessionReady, currentUser } = useApp();
  const fetchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isMounted = useRef(true);
  const conversationIdRef = useRef(conversationId);

  const { messageIds, addMessagesWithoutDuplicates, clearMessageIds } = useMessageDeduplication();
  const { fetchMessages } = useMessageFetching(userId, userName, conversationId, currentUser);

  // Update ref when conversation ID changes
  useEffect(() => {
    conversationIdRef.current = conversationId;
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
    if (fetchTimeoutRef.current) {
      clearTimeout(fetchTimeoutRef.current);
    }

    const loadMessages = async () => {
      if (!isSessionReady || !conversationId || conversationId === 'new') {
        setLoading(false);
        return;
      }

      setLoading(true);
      const fetchedMessages = await fetchMessages();
      
      if (isMounted.current) {
        setMessages(prev => addMessagesWithoutDuplicates(prev, fetchedMessages));
        setLoading(false);
      }
    };

    if (isSessionReady && conversationId && conversationId !== 'new') {
      loadMessages();
    }
  }, [userId, currentUser?.id, conversationId, fetchMessages, isSessionReady, addMessagesWithoutDuplicates]);

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

  const refreshMessages = () => {
    if (isSessionReady && conversationId && conversationId !== 'new') {
      fetchMessages().then(fetchedMessages => {
        if (isMounted.current) {
          setMessages(prev => addMessagesWithoutDuplicates(prev, fetchedMessages));
        }
      });
    }
  };

  return {
    messages,
    setMessages,
    addMessage,
    loading,
    isSending,
    setIsSending,
    refreshMessages,
    deleteMessage
  };
};

export default useDMMessages;
