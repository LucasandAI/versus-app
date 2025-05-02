
import React, { memo } from 'react';
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

// Memoize the component to prevent unnecessary re-renders
const MessageList: React.FC<MessageListProps> = memo(({
  messages,
  clubMembers,
  isSupport = false,
  onDeleteMessage,
  onSelectUser,
  formatTime,
  currentUserAvatar,
  currentUserId,
  lastMessageRef
}) => {
  // Use useMemo to avoid recreating message items on every render
  const messageItems = React.useMemo(() => {
    return messages.map((message: ChatMessage, index: number) => {
      const isUserMessage = currentUserId && 
                           message.sender && 
                           String(message.sender.id) === String(currentUserId);
      const isLastMessage = index === messages.length - 1;
      
      return (
        <div 
          key={`msg-${message.id}`} 
          ref={isLastMessage ? lastMessageRef : undefined}
          className={`mb-3 ${isLastMessage ? 'pb-5' : ''}`}
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
    });
  }, [messages, currentUserId, lastMessageRef, isSupport, onDeleteMessage, onSelectUser, formatTime, currentUserAvatar]);

  return (
    <div className="flex-1 px-0 py-2">
      {messages.length === 0 ? (
        <div className="h-full flex items-center justify-center text-gray-500 text-sm py-4">
          No messages yet. Start the conversation!
        </div>
      ) : (
        <>
          {messageItems}
          {/* Add proper spacing at the bottom to ensure visibility above the input bar */}
          <div className="h-4"></div>
        </>
      )}
    </div>
  );
});

MessageList.displayName = 'MessageList';

export default MessageList;
