import { useCallback, useRef } from 'react';
import { ChatMessage } from '@/types/chat';

export const useMessageOptimism = () => {
  const optimisticMessageIds = useRef(new Set<string>());

  const addOptimisticMessage = useCallback((message: ChatMessage) => {
    const msgId = message.id?.toString();
    if (!msgId) return;

    // Track this as an optimistic message
    optimisticMessageIds.current.add(msgId);
    
    console.log('[useMessageOptimism] Added optimistic message:', msgId);
  }, []);

  const scrollToBottom = useCallback(() => {
    // Find the message container
    const container = document.querySelector('.message-list-container');
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  }, []);

  return {
    addOptimisticMessage,
    scrollToBottom
  };
}; 