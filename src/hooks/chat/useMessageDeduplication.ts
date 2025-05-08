
import { useState, useCallback, useMemo } from 'react';
import { ChatMessage } from '@/types/chat';

// Generate a stable ID for messages to help with deduplication
export const createMessageId = (message: ChatMessage | any): string => {
  if (!message) return 'invalid-message';
  
  // For optimistic messages with temporary IDs
  if (message.optimistic || message.id?.toString().startsWith('temp-')) {
    return message.id?.toString() || `temp-${Date.now()}`;
  }
  
  // For server messages, use the ID directly if it's a string
  if (typeof message.id === 'string') {
    return message.id;
  }
  
  // For numeric or complex IDs, create a compound ID
  const senderId = message.sender?.id || message.sender_id || 'unknown';
  const timestamp = message.timestamp || Date.now().toString();
  const text = message.text || message.message || '';
  const contentHash = text.slice(0, 20) + text.length;
  
  return `${senderId}-${timestamp}-${contentHash}`;
};

export const useMessageDeduplication = () => {
  const [messageIdMap, setMessageIdMap] = useState<Record<string, boolean>>({});
  
  // Check if a message exists in our map
  const hasMessage = useCallback((message: ChatMessage): boolean => {
    const messageId = createMessageId(message);
    return !!messageIdMap[messageId];
  }, [messageIdMap]);
  
  // Add a message to the map and return true if it was new
  const addMessage = useCallback((message: ChatMessage): boolean => {
    const messageId = createMessageId(message);
    
    if (messageIdMap[messageId]) {
      return false;
    }
    
    setMessageIdMap(prev => ({ ...prev, [messageId]: true }));
    return true;
  }, [messageIdMap]);
  
  // Add multiple messages, skipping duplicates
  const addMessagesWithoutDuplicates = useCallback((
    prevMessages: ChatMessage[],
    newMessages: ChatMessage[]
  ): ChatMessage[] => {
    if (!newMessages || newMessages.length === 0) return prevMessages;
    
    const uniqueNewMessages: ChatMessage[] = [];
    const updatedMap = { ...messageIdMap };
    
    // Ensure all existing messages are in the map
    prevMessages.forEach(msg => {
      const id = createMessageId(msg);
      updatedMap[id] = true;
    });
    
    // Add only unique new messages
    newMessages.forEach(msg => {
      const id = createMessageId(msg);
      if (!updatedMap[id]) {
        uniqueNewMessages.push(msg);
        updatedMap[id] = true;
      }
    });
    
    if (uniqueNewMessages.length > 0) {
      // Update the map with new messages
      setMessageIdMap(updatedMap);
      return [...prevMessages, ...uniqueNewMessages];
    }
    
    return prevMessages;
  }, [messageIdMap]);
  
  // Clear all tracked messages
  const clearMessageIds = useCallback(() => {
    setMessageIdMap({});
  }, []);
  
  // Get array of tracked message IDs
  const messageIds = useMemo(() => Object.keys(messageIdMap), [messageIdMap]);
  
  return {
    messageIds,
    hasMessage,
    addMessage,
    addMessagesWithoutDuplicates,
    clearMessageIds
  };
};
