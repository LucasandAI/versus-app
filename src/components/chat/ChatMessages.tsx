
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
}

const ChatMessages: React.FC<ChatMessagesProps> = ({
  messages,
  clubMembers = [],
  onDeleteMessage,
  onSelectUser,
  isSupport = false,
  currentUserAvatar = '/placeholder.svg'
}) => {
  const lastMessageRef = useRef<HTMLDivElement>(null);
  const [hasScrolled, setHasScrolled] = useState(false);
  const { currentUser } = useApp();

  useEffect(() => {
    // Scroll to bottom when messages change if we haven't manually scrolled up
    if (lastMessageRef.current && !hasScrolled) {
      lastMessageRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, hasScrolled]);

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
        lastMessageRef={lastMessageRef}
      />
    </div>
  );
};

export default ChatMessages;
