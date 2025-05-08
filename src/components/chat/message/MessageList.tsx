import React, { memo } from 'react';
import { ChatMessage } from '@/types/chat';
import MessageItem from './MessageItem';
import { formatDistanceToNow } from 'date-fns';

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
      
      // Use stable key with index to prevent remounting on ID changes
      const showTimestamp = index === 0 || 
        new Date(message.timestamp).getTime() - new Date(messages[index - 1].timestamp).getTime() > 5 * 60 * 1000;
      
      return (
        <div 
          key={message.id || `msg-${index}`}
          ref={isLastMessage ? lastMessageRef : undefined}
          className={`mb-3 ${isLastMessage ? 'pb-5' : ''}`}
        >
          {showTimestamp && (
            <div className="flex justify-center my-2">
              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                {formatDistanceToNow(new Date(message.timestamp), { addSuffix: true })}
              </span>
            </div>
          )}
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
    <div className="flex-1 px-0 py-2 min-h-full">
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
}, (prevProps, nextProps) => {
  // Custom equality check to prevent unnecessary re-renders
  if (prevProps.messages.length !== nextProps.messages.length) {
    return false; // Re-render if message count changes
  }
  
  // Compare last message ID to detect new messages
  if (prevProps.messages.length > 0 && nextProps.messages.length > 0) {
    const prevLastMsg = prevProps.messages[prevProps.messages.length - 1];
    const nextLastMsg = nextProps.messages[nextProps.messages.length - 1];
    if (prevLastMsg.id !== nextLastMsg.id) {
      return false; // Re-render if last message changed
    }
  }
  
  return true; // Don't re-render otherwise
});

MessageList.displayName = 'MessageList';

export default MessageList;
