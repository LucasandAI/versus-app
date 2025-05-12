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
      className={`p-3 rounded-2xl break-words max-w-[85%] ${
        isUserMessage 
          ? 'bg-primary text-white ml-auto rounded-tr-none' 
          : isSupport
            ? 'bg-blue-100 text-blue-800 rounded-tl-none'
            : 'bg-gray-100 text-gray-800 rounded-tl-none'
      }`}
    >
      {message.text}
    </div>
  );
};

export default MessageContent;
