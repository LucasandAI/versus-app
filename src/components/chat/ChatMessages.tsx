
import React, { memo } from 'react';
import MessageList from './message/MessageList';
import { useMessageUser } from './message/useMessageUser';
import { useMessageFormatting } from '@/hooks/chat/messages/useMessageFormatting';
import { ClubMessage, DirectMessage } from '@/context/ChatContext';

interface ChatMessagesProps {
  messages: (ClubMessage | DirectMessage)[];
  clubMembers: Array<{
    id: string;
    name: string;
    avatar?: string;
  }>;
  isSupport?: boolean;
  onDeleteMessage?: (messageId: string) => void;
  onSelectUser?: (userId: string, userName: string, userAvatar?: string) => void;
  currentUserAvatar?: string;
  lastMessageRef?: React.RefObject<HTMLDivElement>;
  formatTime?: (isoString: string) => string;
}

// Use memo to prevent unnecessary re-renders
const ChatMessages: React.FC<ChatMessagesProps> = memo(({
  messages,
  clubMembers,
  isSupport = false,
  onDeleteMessage,
  onSelectUser,
  currentUserAvatar: providedUserAvatar,
  lastMessageRef: providedLastMessageRef,
  formatTime: providedFormatTime,
}) => {
  const {
    currentUserId,
    currentUserAvatar: defaultUserAvatar
  } = useMessageUser();
  
  const {
    formatTime: defaultFormatTime
  } = useMessageFormatting();

  // Use provided values or defaults
  const finalUserAvatar = providedUserAvatar || defaultUserAvatar;
  const finalLastMessageRef = providedLastMessageRef;
  const finalFormatTime = providedFormatTime || defaultFormatTime;
  
  // Handle case when messages is not an array
  if (!Array.isArray(messages)) {
    return (
      <div className="flex-1 p-4">
        <div className="h-full flex items-center justify-center text-gray-500 text-sm">
          No messages yet. Start the conversation!
        </div>
      </div>
    );
  }
  
  // Log messages for debugging
  console.log('[ChatMessages] Processing messages array:', messages.length);
  
  return (
    <div className="px-4 py-2 h-full">
      <MessageList 
        messages={messages} 
        clubMembers={clubMembers} 
        isSupport={isSupport} 
        onDeleteMessage={onDeleteMessage} 
        onSelectUser={onSelectUser} 
        formatTime={finalFormatTime} 
        currentUserAvatar={finalUserAvatar} 
        currentUserId={currentUserId} 
        lastMessageRef={finalLastMessageRef} 
      />
    </div>
  );
});

ChatMessages.displayName = 'ChatMessages';

export default ChatMessages;
