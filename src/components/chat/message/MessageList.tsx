
import React, { useRef } from 'react';
import { ChatMessage } from '@/types/chat';
import MessageItem from './MessageItem';

interface MessageListProps {
  messages: ChatMessage[];
  clubMembers: Array<{
    id: string;
    name: string;
    avatar?: string;
  }>;
  isSupport?: boolean;
  onDeleteMessage?: (messageId: string) => void;
  onSelectUser?: (userId: string, userName: string, userAvatar?: string) => void;
  formatTime: (isoString: string) => string;
  currentUserAvatar: string;
  currentUserId: string | null;
}

const MessageList: React.FC<MessageListProps> = ({
  messages,
  clubMembers,
  isSupport = false,
  onDeleteMessage,
  onSelectUser,
  formatTime,
  currentUserAvatar,
  currentUserId,
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  return (
    <>
      {messages.length === 0 ? (
        <div className="h-full flex items-center justify-center text-gray-500 text-sm">
          No messages yet. Start the conversation!
        </div>
      ) : (
        messages.map((message: ChatMessage) => {
          // Check if the message was sent by the current user
          const isUserMessage = currentUserId && message.sender && 
            String(message.sender.id) === String(currentUserId);
          
          return (
            <MessageItem
              key={message.id}
              message={message}
              isUserMessage={isUserMessage}
              isSupport={isSupport}
              onDeleteMessage={onDeleteMessage}
              onSelectUser={onSelectUser}
              formatTime={formatTime}
              currentUserAvatar={currentUserAvatar}
            />
          );
        })
      )}
      <div ref={messagesEndRef} />
    </>
  );
};

export default MessageList;
