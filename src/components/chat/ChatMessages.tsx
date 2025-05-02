
import React, { useEffect, useRef, useState } from 'react';
import { ChatMessage } from '@/types';
import MessageList from './message/MessageList';
import { useMessageUser } from './message/useMessageUser';
import { useMessageNormalization } from './message/useMessageNormalization';
import { useMessageScroll } from '@/hooks/chat/useMessageScroll';
import { useCurrentMember } from '@/hooks/chat/messages/useCurrentMember';
import { useMessageFormatting } from '@/hooks/chat/messages/useMessageFormatting';

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
}

const ChatMessages: React.FC<ChatMessagesProps> = ({
  messages,
  clubMembers,
  isSupport = false,
  onDeleteMessage,
  onSelectUser,
  currentUserAvatar: providedUserAvatar,
  lastMessageRef: providedLastMessageRef,
  formatTime: providedFormatTime,
}) => {
  const renderCountRef = useRef(0);
  const [forceUpdateKey, setForceUpdateKey] = useState(Date.now());
  
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
    scrollRef,
    lastMessageRef: defaultLastMessageRef,
    scrollToBottom
  } = useMessageScroll(messages);
  
  const {
    normalizeMessage
  } = useMessageNormalization(currentUserId, senderId => getMemberName(senderId, currentUserId, clubMembers));

  // Use provided values or defaults
  const finalUserAvatar = providedUserAvatar || defaultUserAvatar;
  const finalLastMessageRef = providedLastMessageRef || defaultLastMessageRef;
  const finalFormatTime = providedFormatTime || defaultFormatTime;
  
  // Enhanced debug effect to track message updates
  useEffect(() => {
    renderCountRef.current += 1;
    
    console.log(`[ChatMessages] 🔄 Render #${renderCountRef.current}`, {
      messageCount: Array.isArray(messages) ? messages.length : 'No messages array'
    });
    
    // Auto-scroll on new messages with a slight delay to ensure DOM is updated
    if (Array.isArray(messages) && messages.length > 0) {
      setTimeout(scrollToBottom, 100);
    }
  }, [messages, scrollToBottom]);
  
  // Force a re-render when a club message event is received
  useEffect(() => {
    const handleForceUpdate = (e: CustomEvent) => {
      setForceUpdateKey(Date.now());
      setTimeout(scrollToBottom, 100);
    };
    
    window.addEventListener('clubMessageForceUpdate', handleForceUpdate as EventListener);
    
    return () => {
      window.removeEventListener('clubMessageForceUpdate', handleForceUpdate as EventListener);
    };
  }, [scrollToBottom]);
  
  if (!Array.isArray(messages)) {
    return (
      <div className="flex-1 p-4">
        <div className="h-full flex items-center justify-center text-gray-500 text-sm">
          No messages yet. Start the conversation!
        </div>
      </div>
    );
  }

  // Always create a fresh array to ensure proper re-rendering
  const normalizedMessages = messages.map(message => normalizeMessage(message));

  // Determine if this is a club chat by checking if there are club members
  const isClubChat = clubMembers.length > 0;
  
  // Create a unique key that changes when messages update
  const messageListKey = `messages-${normalizedMessages.length}-${forceUpdateKey}`;

  return (
    <div 
      ref={scrollRef} 
      className={`overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent ${
        isClubChat ? 'h-[calc(73vh-8rem)]' : 'h-[calc(73vh-6rem)]'
      }`}
    >
      {/* Enhanced debug information */}
      <div className="bg-blue-50 px-2 py-1 text-xs">
        💬 Messages: {normalizedMessages.length} | 🔄 Renders: {renderCountRef.current}
        {normalizedMessages.length > 0 && (
          <span> | 🆔 Latest: {normalizedMessages[normalizedMessages.length - 1]?.id?.substring(0, 6) || 'none'}...</span>
        )}
      </div>
      
      <MessageList 
        key={messageListKey}
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
};

export default ChatMessages;
