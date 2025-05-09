
import React, { memo, useMemo, useEffect } from 'react';
import { ChatMessage } from '@/types/chat';
import MessageList from './message/MessageList';
import LoadMoreButton from './message/LoadMoreButton';
import { useMessageUser } from './message/useMessageUser';
import { useMessageNormalization } from './message/useMessageNormalization';
import { useMessageScroll } from '@/hooks/chat/useMessageScroll';
import { useCurrentMember } from '@/hooks/chat/messages/useCurrentMember';
import { useMessageFormatting } from '@/hooks/chat/messages/useMessageFormatting';
import Spinner from '../ui/spinner';

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
  onLoadMore?: () => void;
  hasMore?: boolean;
  isLoadingMore?: boolean;
}

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
  onLoadMore,
  hasMore = false,
  isLoadingMore = false,
}) => {
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
    scrollToBottom,
    forceScrollToBottom
  } = useMessageScroll(messages);

  // Use provided values or defaults
  const finalUserAvatar = providedUserAvatar || defaultUserAvatar;
  const finalLastMessageRef = providedLastMessageRef || defaultLastMessageRef;
  const finalFormatTime = providedFormatTime || defaultFormatTime;
  const finalScrollRef = providedScrollRef || defaultScrollRef;
  
  // Scroll to bottom when messages change or on initial render
  useEffect(() => {
    if (messages.length > 0) {
      // Wait for next tick to ensure DOM updates
      const timer = setTimeout(() => {
        scrollToBottom();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [messages.length, scrollToBottom]);
  
  // Force scroll to bottom when a new message is sent by the current user
  // This is identified by checking if the last message is from the current user
  useEffect(() => {
    if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      // If the last message is from the current user, scroll to bottom
      if (lastMessage.sender?.id === currentUserId) {
        forceScrollToBottom();
      }
    }
  }, [messages, currentUserId, forceScrollToBottom]);

  // Save scroll position when loading more messages
  const handleLoadMore = () => {
    if (onLoadMore && hasMore && !isLoadingMore && finalScrollRef.current) {
      // Store the current scroll position and height before loading more messages
      const scrollTop = finalScrollRef.current.scrollTop;
      const scrollHeight = finalScrollRef.current.scrollHeight;
      
      // Load more messages
      onLoadMore();
      
      // After loading, restore scroll position accounting for new content
      requestAnimationFrame(() => {
        if (finalScrollRef.current) {
          const newScrollHeight = finalScrollRef.current.scrollHeight;
          const heightDifference = newScrollHeight - scrollHeight;
          finalScrollRef.current.scrollTop = scrollTop + heightDifference;
        }
      });
    }
  };
  
  // Only normalize messages once per unique message set
  const normalizedMessages = useMemo(() => {
    return messages.map(message => normalizeMessage(message));
  }, [messages, normalizeMessage]);

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

  // Determine if this is a club chat by checking if there are club members
  const isClubChat = clubMembers.length > 0;

  return (
    <div 
      ref={finalScrollRef} 
      className={`overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent ${
        isClubChat ? 'h-[calc(73vh-8rem)]' : 'h-[calc(73vh-6rem)]'
      }`}
    >
      {/* "Load More" button that only appears if there are more messages to load */}
      {hasMore && (
        <LoadMoreButton
          onLoadMore={handleLoadMore}
          isLoading={isLoadingMore}
        />
      )}
      
      {isLoadingMore && (
        <div className="flex justify-center py-2">
          <Spinner size="sm" />
        </div>
      )}
      
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
    </div>
  );
});

ChatMessages.displayName = 'ChatMessages';

export default ChatMessages;
