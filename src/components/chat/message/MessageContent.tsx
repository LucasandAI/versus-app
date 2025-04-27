
import React from 'react';
import { ChatMessage } from '@/types/chat';

interface MessageContentProps {
  message: ChatMessage;
  isUserMessage: boolean;
  isSupport: boolean;
  onDeleteMessage?: () => void;
}

const MessageContent: React.FC<MessageContentProps> = ({
  message,
  isUserMessage,
  isSupport,
}) => {
  // Use distinctive styling based on message ownership and type
  return (
    <div 
      className={`p-3 rounded-lg break-words ${
        isUserMessage 
          ? 'bg-primary text-white ml-auto' // Added ml-auto to align user messages to the right
          : isSupport && message.isSupport
            ? 'bg-blue-100 text-blue-800'
            : 'bg-gray-100 text-gray-800'
      }`}
      style={{ 
        maxWidth: '85%',
        // Add margin-left: auto for user messages to align them to the right
        ...(isUserMessage ? { marginLeft: 'auto' } : {})
      }}
    >
      {message.text}
    </div>
  );
};

export default MessageContent;
