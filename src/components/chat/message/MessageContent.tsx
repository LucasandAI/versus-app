
import React from 'react';
import { ClubMessage, DirectMessage } from '@/context/ChatContext';

interface MessageContentProps {
  message: ClubMessage | DirectMessage;
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
          ? `bg-primary text-white ${message.status === 'error' ? 'opacity-70' : ''}`
          : isSupport
            ? 'bg-blue-100 text-blue-800'
            : 'bg-gray-100 text-gray-800'
      }`}
    >
      {message.text}
    </div>
  );
};

export default MessageContent;
