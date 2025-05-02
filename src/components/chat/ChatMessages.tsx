
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
  const previousMessagesLengthRef = useRef<number>(0);
  const messagesStableIdRef = useRef<string>("");
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
  
  // Generate a stable ID for the current messages array to detect real changes
  const generateMessagesId = () => {
    if (!Array.isArray(messages) || messages.length === 0) return "";
    // Use last message's ID and timestamp as a fingerprint
    const lastMsg = messages[messages.length - 1];
    return `${lastMsg?.id || "none"}-${lastMsg?.timestamp || "none"}-${messages.length}`;
  };
  
  // Enhanced debug effect to track message updates with more detail
  useEffect(() => {
    renderCountRef.current += 1;
    const hasNewMessages = Array.isArray(messages) && messages.length > previousMessagesLengthRef.current;
    const currentMessagesId = generateMessagesId();
    const isReallyNewMessages = currentMessagesId !== messagesStableIdRef.current;
    
    console.log(`[ChatMessages] 🔄 Render #${renderCountRef.current}`, {
      messageCount: Array.isArray(messages) ? messages.length : 'No messages array',
      previousCount: previousMessagesLengthRef.current,
      newMessages: hasNewMessages,
      messagesChanged: isReallyNewMessages,
      currentId: currentMessagesId,
      previousId: messagesStableIdRef.current
    });
    
    // Update our tracking references
    if (isReallyNewMessages) {
      messagesStableIdRef.current = currentMessagesId;
      // Force update when messages really change
      setForceUpdateKey(Date.now());
    }
    
    if (Array.isArray(messages)) {
      previousMessagesLengthRef.current = messages.length;
      
      if (messages.length > 0 && hasNewMessages) {
        // Log info about last message
        const lastMsg = messages[messages.length - 1];
        console.log('[ChatMessages] ✨ Last message:', {
          id: lastMsg.id,
          sender: lastMsg.sender?.name || lastMsg.sender_id,
          message: lastMsg.message?.substring(0, 30) + (lastMsg.message?.length > 30 ? '...' : '')
        });
        
        // Auto-scroll on new messages with a slight delay to ensure DOM is updated
        setTimeout(scrollToBottom, 100);
      }
    }
  }, [messages, scrollToBottom]);
  
  if (!Array.isArray(messages)) {
    return (
      <div className="flex-1 p-4">
        <div className="h-full flex items-center justify-center text-gray-500 text-sm">
          No messages yet. Start the conversation!
        </div>
      </div>
    );
  }

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
          <span> | 🆔 ID: {messagesStableIdRef.current.substring(0, 8)}...</span>
        )}
        | 🔑 Key: {messageListKey.substring(0, 15)}...
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
