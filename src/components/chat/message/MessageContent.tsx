
import React from 'react';
import { ChatMessage } from '@/types/chat';
import MessageDeleteButton from './MessageDeleteButton';

interface MessageContentProps {
  message: ChatMessage;
  isUserMessage: boolean;
  isSupport: boolean;
  onDeleteMessage?: (messageId: string) => void;
}

const MessageContent: React.FC<MessageContentProps> = ({
  message,
  isUserMessage,
  isSupport,
  onDeleteMessage,
}) => {
  return (
    <div className="flex items-start gap-2">
      <div 
        className={`rounded-lg p-3 text-sm break-words flex-grow ${
          isUserMessage 
            ? 'bg-primary text-white' 
            : isSupport
            ? 'bg-blue-100 text-blue-800'
            : 'bg-gray-100 text-gray-800'
        }`}
      >
        {message.text}
      </div>

      {/* Only show delete button if it's the user's message AND we have a delete handler AND it's not a support message */}
      {isUserMessage && onDeleteMessage && !isSupport && (
        <MessageDeleteButton onDelete={() => onDeleteMessage(message.id)} />
      )}
    </div>
  );
};

export default MessageContent;
