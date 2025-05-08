
import React, { memo, useRef } from 'react';
import { ChatMessage } from '@/types/chat';
import MessageList from './message/MessageList';
import { useMessageUser } from './message/useMessageUser';
import { useMessageNormalization } from './message/useMessageNormalization';
import { useCurrentMember } from '@/hooks/chat/messages/useCurrentMember';
import { useMessageFormatting } from '@/hooks/chat/messages/useMessageFormatting';
import { Loader2 } from 'lucide-react';

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
  hasMore?: boolean;
  loadMore?: () => void;
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
  isLoading = false,
  hasMore = false,
  loadMore
}) => {
  // Create stable references to prevent recreation
  const loadMoreRef = useRef<HTMLDivElement>(null);
  
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

  // Use provided values or defaults
  const finalUserAvatar = providedUserAvatar || defaultUserAvatar;
  const finalLastMessageRef = providedLastMessageRef;
  const finalFormatTime = providedFormatTime || defaultFormatTime;
  const finalScrollRef = providedScrollRef;
  
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

  // Function to handle intersection observer for infinite scrolling
  const handleIntersection = (entries: IntersectionObserverEntry[]) => {
    if (entries[0].isIntersecting && hasMore && !isLoading && loadMore) {
      loadMore();
    }
  };
  
  // Set up intersection observer when the component mounts
  React.useEffect(() => {
    if (!loadMoreRef.current || !hasMore || !loadMore) return;
    
    const observer = new IntersectionObserver(handleIntersection, {
      root: null,
      rootMargin: '100px',
      threshold: 0.1
    });
    
    observer.observe(loadMoreRef.current);
    
    return () => {
      observer.disconnect();
    };
  }, [hasMore, loadMore, loadMoreRef]);

  // Determine if this is a club chat by checking if there are club members
  const isClubChat = clubMembers.length > 0;

  return (
    <div 
      ref={finalScrollRef} 
      className={`overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent ${
        isClubChat ? 'h-[calc(73vh-8rem)]' : 'h-[calc(73vh-6rem)]'
      }`}
    >
      {/* Loading indicator at the top for loading more messages */}
      {hasMore && (
        <div 
          ref={loadMoreRef} 
          className="py-2 flex justify-center items-center"
        >
          {isLoading ? (
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          ) : (
            <div className="h-6 w-6" /> // Empty spacer
          )}
        </div>
      )}
      
      <MessageList 
        messages={messages.map(message => normalizeMessage(message))} 
        clubMembers={clubMembers} 
        isSupport={isSupport} 
        onDeleteMessage={onDeleteMessage} 
        onSelectUser={onSelectUser} 
        formatTime={finalFormatTime} 
        currentUserAvatar={finalUserAvatar} 
        currentUserId={currentUserId} 
        lastMessageRef={finalLastMessageRef} 
      />
      
      {/* Empty messages state */}
      {messages.length === 0 && !isLoading && (
        <div className="h-full flex items-center justify-center text-gray-500 text-sm py-4">
          No messages yet. Start the conversation!
        </div>
      )}
      
      {/* Add proper spacing at the bottom to ensure visibility above the input bar */}
      <div className="h-4"></div>
    </div>
  );
});

ChatMessages.displayName = 'ChatMessages';

export default ChatMessages;
