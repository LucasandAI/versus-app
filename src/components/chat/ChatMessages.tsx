
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
  // Add the missing lastMessageRef prop to fix the TypeScript error
  lastMessageRef?: React.RefObject<HTMLDivElement>;
}

const ChatMessages: React.FC<ChatMessagesProps> = ({
  messages,
  clubMembers = [],
  onDeleteMessage,
  onSelectUser,
  isSupport = false,
  currentUserAvatar = '/placeholder.svg',
  // Add the lastMessageRef prop to the component props
  lastMessageRef
}) => {
  // Create a default ref if one is not provided
  const defaultLastMessageRef = useRef<HTMLDivElement>(null);
  const [hasScrolled, setHasScrolled] = useState(false);
  const { currentUser } = useApp();
  
  // Use the provided ref or fall back to the default one
  const messageRef = lastMessageRef || defaultLastMessageRef;

  useEffect(() => {
    // Scroll to bottom when messages change if we haven't manually scrolled up
    if (messageRef.current && !hasScrolled) {
      messageRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, hasScrolled, messageRef]);

  const formatTime = (isoString: string) => {
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
        formatTime={formatTime}
        currentUserAvatar={currentUserAvatar || '/placeholder.svg'}
        currentUserId={currentUser?.id || null}
        lastMessageRef={messageRef}
      />
    </div>
  );
};

export default ChatMessages;
