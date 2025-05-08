
import React, { memo, useMemo, useRef } from 'react';
import { ChatMessage } from '@/types/chat';
import MessageList from './message/MessageList';
import { useMessageUser } from './message/useMessageUser';
import { useMessageNormalization } from './message/useMessageNormalization';
import { useMessageScroll } from '@/hooks/chat/useMessageScroll';
import { useCurrentMember } from '@/hooks/chat/messages/useCurrentMember';
import { useMessageFormatting } from '@/hooks/chat/messages/useMessageFormatting';
import { Spinner } from '@/components/ui/spinner';

interface ChatMessagesProps {
  messages: ChatMessage[] | any[];
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
  scrollRef?: React.RefObject<HTMLDivElement>;
  isLoading?: boolean;
}

// Use memo to prevent unnecessary re-renders with consistent identity reference
const ChatMessages: React.FC<ChatMessagesProps> = memo(({
  messages,
  clubMembers,
  isSupport = false,
  onDeleteMessage,
  onSelectUser,
  currentUserAvatar: providedUserAvatar,
  lastMessageRef: providedLastMessageRef,
  formatTime: providedFormatTime,
  scrollRef: providedScrollRef,
  isLoading = false
}) => {
  // Create stable references to prevent recreation
  const prevMessageLengthRef = useRef<number>(0);
  
  const {
    currentUserId,
    currentUserAvatar: defaultUserAvatar
  } = useMessageUser();
  
  const {
    currentUserInClub
  } = useCurrentMember(currentUserId, clubMembers);
  
  const {
    formatTime: defaultFormatTime,
    getMemberName
  } = useMessageFormatting();
  
  const {
    normalizeMessage
  } = useMessageNormalization(currentUserId, senderId => getMemberName(senderId, currentUserId, clubMembers));

  // Custom scroll hook that uses stable refs
  const {
    scrollRef: defaultScrollRef,
    lastMessageRef: defaultLastMessageRef,
    scrollToBottom
  } = useMessageScroll(messages);

  // Use provided values or defaults - store references to prevent recreation
  const finalUserAvatar = providedUserAvatar || defaultUserAvatar;
  const finalLastMessageRef = providedLastMessageRef || defaultLastMessageRef;
  const finalFormatTime = providedFormatTime || defaultFormatTime;
  const finalScrollRef = providedScrollRef || defaultScrollRef;
  
  // Handle case when messages is not an array or when loading
  if (!Array.isArray(messages)) {
    return (
      <div className="flex-1 p-4">
        <div className="h-full flex items-center justify-center text-gray-500 text-sm">
          No messages yet. Start the conversation!
        </div>
      </div>
    );
  }
  
  // Only normalize messages once per unique message set
  // Using useMemo with messages reference as dependency
  const normalizedMessages = useMemo(() => {
    // Debug log a sample message to see what's coming in
    if (messages.length > 0) {
      console.log('[ChatMessages] Processing messages array:', messages.length);
    }
    
    const normalized = messages.map(message => normalizeMessage(message));
    return normalized;
  }, [messages, normalizeMessage]);

  // Track if messages changed and need scroll
  if (prevMessageLengthRef.current !== messages.length) {
    // Use requestAnimationFrame to scroll after render
    if (messages.length > prevMessageLengthRef.current) {
      requestAnimationFrame(() => scrollToBottom());
    }
    prevMessageLengthRef.current = messages.length;
  }

  // Determine if this is a club chat by checking if there are club members
  const isClubChat = clubMembers.length > 0;

  return (
    <div 
      ref={finalScrollRef} 
      className={`overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent ${
        isClubChat ? 'h-[calc(73vh-8rem)]' : 'h-[calc(73vh-6rem)]'
      }`}
    >
      {isLoading && messages.length === 0 ? (
        <div className="h-full flex items-center justify-center">
          <Spinner />
        </div>
      ) : normalizedMessages.length === 0 ? (
        <div className="h-full flex items-center justify-center text-gray-500 text-sm">
          No messages yet. Start the conversation!
        </div>
      ) : (
        <MessageList 
          messages={normalizedMessages} 
          clubMembers={clubMembers} 
          isSupport={isSupport} 
          onDeleteMessage={onDeleteMessage} 
          onSelectUser={onSelectUser} 
          formatTime={finalFormatTime} 
          currentUserAvatar={finalUserAvatar} 
          currentUserId={currentUserId} 
          lastMessageRef={finalLastMessageRef} 
        />
      )}
    </div>
  );
});

ChatMessages.displayName = 'ChatMessages';

export default ChatMessages;
