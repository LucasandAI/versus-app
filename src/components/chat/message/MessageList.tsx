
import React from 'react';
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
  lastMessageRef: React.RefObject<HTMLDivElement>;
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
  lastMessageRef,
}) => {
  return (
    <div className="flex flex-col h-full justify-end">
      {messages.length === 0 ? (
        <div className="flex items-center justify-center text-gray-500 text-sm py-8">
          No messages yet. Start the conversation!
        </div>
      ) : (
        <div className="flex flex-col">
          {[...messages]
            .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
            .map((message: ChatMessage, index: number) => {
              const isUserMessage = currentUserId && message.sender && 
                String(message.sender.id) === String(currentUserId);
              const isLastMessage = index === messages.length - 1;
              
              return (
                <div 
                  key={message.id}
                  ref={isLastMessage ? lastMessageRef : undefined}
                  className="mb-2 last:mb-0"
                >
                  <MessageItem
                    message={message}
                    isUserMessage={isUserMessage}
                    isSupport={isSupport}
                    onDeleteMessage={onDeleteMessage}
                    onSelectUser={onSelectUser}
                    formatTime={formatTime}
                    currentUserAvatar={currentUserAvatar}
                  />
                </div>
              );
            })}
        </div>
      )}
    </div>
  );
};

export default MessageList;
