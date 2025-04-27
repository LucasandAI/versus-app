
import React, { useEffect, useRef, useState } from 'react';
import { ChatMessage } from '@/types/chat';
import { useApp } from '@/context/AppContext';
import { format } from 'date-fns';
import MessageList from './message/MessageList';

interface ChatMessagesProps {
  messages: ChatMessage[];
  clubMembers?: Array<{
    id: string;
    name: string;
    avatar?: string;
  }>;
  onDeleteMessage?: (messageId: string) => void;
  onSelectUser?: (userId: string, userName: string, userAvatar?: string) => void;
  isSupport?: boolean;
  currentUserAvatar?: string;
  lastMessageRef?: React.RefObject<HTMLDivElement>;
  formatTime?: (isoString: string) => string; // Add formatTime prop
}

const ChatMessages: React.FC<ChatMessagesProps> = ({
  messages,
  clubMembers = [],
  onDeleteMessage,
  onSelectUser,
  isSupport = false,
  currentUserAvatar = '/placeholder.svg',
  lastMessageRef,
  formatTime: externalFormatTime // Accept the external formatTime function
}) => {
  const defaultLastMessageRef = useRef<HTMLDivElement>(null);
  const [hasScrolled, setHasScrolled] = useState(false);
  const { currentUser } = useApp();
  
  const messageRef = lastMessageRef || defaultLastMessageRef;

  useEffect(() => {
    if (messageRef.current && !hasScrolled) {
      messageRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, hasScrolled, messageRef]);

  // Use provided formatTime function or fall back to default implementation
  const formatTimeInternal = (isoString: string) => {
    if (externalFormatTime) {
      return externalFormatTime(isoString);
    }
    try {
      return format(new Date(isoString), 'h:mm a');
    } catch (error) {
      return 'Invalid time';
    }
  };

  // Debug information
  useEffect(() => {
    if (currentUser && messages.length > 0) {
      console.log('[ChatMessages] Current user ID:', currentUser.id);
      console.log('[ChatMessages] First message sender ID:', messages[0].sender?.id);
      console.log('[ChatMessages] Messages count:', messages.length);
    }
  }, [messages, currentUser]);

  return (
    <div className="flex-1 overflow-y-auto p-4">
      <MessageList
        messages={messages}
        clubMembers={clubMembers}
        isSupport={isSupport}
        onDeleteMessage={onDeleteMessage}
        onSelectUser={onSelectUser}
        formatTime={formatTimeInternal}
        currentUserAvatar={currentUserAvatar || '/placeholder.svg'}
        currentUserId={currentUser?.id || null}
        lastMessageRef={messageRef}
      />
    </div>
  );
};

export default ChatMessages;
