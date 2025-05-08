
import React, { memo, useMemo } from 'react';
import MessageItem from './MessageItem';
import { ClubMessage, DirectMessage } from '@/context/ChatContext';

interface MessageListProps {
  messages: (ClubMessage | DirectMessage)[];
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
  lastMessageRef?: React.RefObject<HTMLDivElement>;
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
  const messageItems = useMemo(() => {
    return messages.map((message, index: number) => {
      const isUserMessage = currentUserId && 
                           message.sender && 
                           String(message.sender.id) === String(currentUserId);
      const isLastMessage = index === messages.length - 1;
      
      // Use stable key with index to prevent remounting on ID changes
      return (
        <div 
          key={message.id || `msg-${index}`}
          ref={isLastMessage && lastMessageRef ? lastMessageRef : undefined}
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
          <div className="h-4"></div>
        </>
      )}
    </div>
  );
});

MessageList.displayName = 'MessageList';

export default MessageList;
