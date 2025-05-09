
import React, { memo, useMemo, useRef, useEffect } from 'react';
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
  onLoadMore,
  hasMore = false,
  isLoadingMore = false,
}) => {
  // Create stable references to prevent recreation
  const prevMessageLengthRef = useRef<number>(0);
  const scrollPositionRef = useRef<number>(0);
  const scrollHeightRef = useRef<number>(0);
  
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
  
  // Save scroll position before loading more messages
  const handleLoadMore = () => {
    if (onLoadMore && hasMore && !isLoadingMore && finalScrollRef.current) {
      // Store the current scroll position and height
      scrollPositionRef.current = finalScrollRef.current.scrollTop;
      scrollHeightRef.current = finalScrollRef.current.scrollHeight;
      
      // Now load more messages
      onLoadMore();
    }
  };
  
  // Restore scroll position after loading more messages
  useEffect(() => {
    if (isLoadingMore === false && prevMessageLengthRef.current < messages.length && scrollHeightRef.current > 0) {
      // The loading has finished and we have more messages
      requestAnimationFrame(() => {
        if (finalScrollRef.current) {
          // Calculate how much the content height has changed
          const newScrollHeight = finalScrollRef.current.scrollHeight;
          const scrollHeightDelta = newScrollHeight - scrollHeightRef.current;
          
          // Adjust scroll position to maintain the same relative position
          finalScrollRef.current.scrollTop = scrollPositionRef.current + scrollHeightDelta;
          
          // Reset stored heights
          scrollHeightRef.current = 0;
        }
      });
    }
    
    // Update previous message count
    prevMessageLengthRef.current = messages.length;
  }, [messages.length, isLoadingMore, finalScrollRef]);
  
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
  
  // Add debug logging to see what's being processed
  console.log('[ChatMessages] Processing messages array:', messages.length);
  
  // Only normalize messages once per unique message set
  // Using useMemo with messages reference as dependency
  const normalizedMessages = useMemo(() => {
    console.log('[ChatMessages] Normalizing messages, count:', messages.length);
    // Debug log a sample message to see what's coming in
    if (messages.length > 0) {
      console.log('[ChatMessages] Sample message before normalization:', messages[messages.length - 1]);
    }
    
    const normalized = messages.map(message => normalizeMessage(message));
    
    // Debug log the normalized result for comparison
    if (normalized.length > 0) {
      console.log('[ChatMessages] Sample normalized message:', normalized[normalized.length - 1]);
    }
    
    return normalized;
  }, [messages, normalizeMessage]);

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
