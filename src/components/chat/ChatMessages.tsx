
import React, { useEffect, useRef } from 'react';
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
  clubId?: string;
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
  clubId,
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
    scrollRef,
    lastMessageRef: defaultLastMessageRef,
    scrollToBottom
  } = useMessageScroll(messages);
  
  const {
    normalizeMessage
  } = useMessageNormalization(currentUserId, senderId => getMemberName(senderId, currentUserId, clubMembers));

  // Track render count for debugging
  const renderCount = useRef(0);
  const prevMessagesLength = useRef(messages?.length || 0);
  
  useEffect(() => {
    renderCount.current += 1;
  });

  // Use provided values or defaults
  const finalUserAvatar = providedUserAvatar || defaultUserAvatar;
  const finalLastMessageRef = providedLastMessageRef || defaultLastMessageRef;
  const finalFormatTime = providedFormatTime || defaultFormatTime;
  
  // Scroll to bottom when messages change
  useEffect(() => {
    const currentMessagesLength = Array.isArray(messages) ? messages.length : 0;
    
    console.log('[ChatMessages] Messages updated:', {
      count: currentMessagesLength,
      prevCount: prevMessagesLength.current,
      changed: currentMessagesLength !== prevMessagesLength.current,
      isArray: Array.isArray(messages),
      clubId,
      renderCount: renderCount.current,
      messagesRef: messages // Log the reference for comparison
    });
    
    prevMessagesLength.current = currentMessagesLength;
    
    scrollToBottom();
  }, [messages, scrollToBottom, clubId]);
  
  if (!Array.isArray(messages) || messages.length === 0) {
    return (
      <div className="flex-1 p-4">
        <div className="h-full flex flex-col items-center justify-center text-gray-500 text-sm">
          <div>No messages yet. Start the conversation!</div>
          <div className="text-xs mt-2 text-gray-400">Render count: {renderCount.current}</div>
        </div>
      </div>
    );
  }

  const normalizedMessages = messages.map(message => normalizeMessage(message));

  // Determine if this is a club chat by checking if there are club members
  const isClubChat = clubMembers.length > 0;

  return (
    <div 
      ref={scrollRef} 
      className={`overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent ${
        isClubChat ? 'h-[calc(73vh-8rem)]' : 'h-[calc(73vh-6rem)]'
      }`}
    >
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
};

export default ChatMessages;
