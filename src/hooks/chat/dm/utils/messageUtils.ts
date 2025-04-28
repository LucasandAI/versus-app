
import { ChatMessage } from '@/types/chat';

export const isOptimisticMessage = (messageId: string): boolean => {
  return messageId.startsWith('temp-');
};

export const createMessageId = (message: ChatMessage): string => {
  return `${message.text}-${message.sender?.id || 'unknown'}-${message.timestamp || Date.now()}`;
};

// Helper function to find matching optimistic messages
export const findMatchingMessage = (
  messages: ChatMessage[],
  message: ChatMessage,
  timeWindow: number = 5
): ChatMessage | undefined => {
  const optimisticMessages = messages.filter(msg => msg.optimistic === true);
  
  return optimisticMessages.find(msg => {
    const textMatch = msg.text === message.text;
    const senderMatch = String(msg.sender.id) === String(message.sender.id);
    
    const msgTime = new Date(msg.timestamp).getTime();
    const confirmedTime = new Date(message.timestamp).getTime();
    const timeDifference = Math.abs(msgTime - confirmedTime) / 1000;
    
    return textMatch && senderMatch && timeDifference <= timeWindow;
  });
};
