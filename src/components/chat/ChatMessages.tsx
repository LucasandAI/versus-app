import React, { useRef, useMemo, memo } from 'react';
import { Button } from '@/components/ui/button';
import MessageList from './MessageList';
import { useMessageUser } from '@/hooks/chat/useMessageUser';
import { useCurrentMember } from '@/hooks/chat/useCurrentMember';
import { useMessageFormatting } from '@/hooks/chat/useMessageFormatting';
import { useMessageNormalization } from '@/hooks/chat/useMessageNormalization';
import { useMessageScroll } from '@/hooks/chat/useMessageScroll';
import { useApp } from '@/context/AppContext';

interface ChatMessagesProps {
  messages: any[];
  clubMembers: any[];
  isSupport?: boolean;
  onDeleteMessage?: (messageId: string) => void;
  onSelectUser?: (userId: string, userName: string, userAvatar?: string) => void;
  currentUserAvatar?: string;
  lastMessageRef?: React.RefObject<HTMLDivElement>;
  formatTime?: (timestamp: string) => string;
  scrollRef?: React.RefObject<HTMLDivElement>;
  hasMore?: boolean;
  isLoadingMore?: boolean;
  onLoadMore?: () => void;
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
  hasMore = false,
  isLoadingMore = false,
  onLoadMore
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
    scrollToBottom
  } = useMessageScroll(messages);

  const { currentUser } = useApp();

  // Use provided values or defaults - store references to prevent recreation
  const finalUserAvatar = providedUserAvatar || defaultUserAvatar;
  const finalLastMessageRef = providedLastMessageRef || defaultLastMessageRef;
  const finalFormatTime = providedFormatTime || defaultFormatTime;
  const finalScrollRef = providedScrollRef || defaultScrollRef;
  
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
      className={`relative overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent ${
        isClubChat ? 'h-[calc(73vh-8rem)]' : 'h-[calc(73vh-6rem)]'
      }`}
    >
      <div className="flex flex-col">
        {/* Load more button */}
        {hasMore && (
          <div className="py-2 flex justify-center">
            <Button
              variant="outline"
              size="sm"
              onClick={onLoadMore}
              disabled={isLoadingMore}
              className="text-sm"
            >
              {isLoadingMore ? 'Loading...' : 'Load More Messages'}
            </Button>
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
    </div>
  );
});

ChatMessages.displayName = 'ChatMessages';

export default ChatMessages;
