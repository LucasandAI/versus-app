import React, { useState, useEffect, useRef } from 'react';
import { ChatMessage } from '@/types/chat';
import MessageList from './message/MessageList';
import { useMessageUser } from './message/useMessageUser';
import { useMessageNormalization } from './message/useMessageNormalization';
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
}
const ChatMessages: React.FC<ChatMessagesProps> = ({
  messages,
  clubMembers,
  isSupport = false,
  onDeleteMessage,
  onSelectUser
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const {
    currentUserId,
    currentUserAvatar
  } = useMessageUser();
  const [currentUserInClub, setCurrentUserInClub] = useState<boolean>(false);
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({
      behavior: 'smooth'
    });
  };
  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  useEffect(() => {
    if (currentUserId && clubMembers.length > 0) {
      const isInClub = clubMembers.some(member => String(member.id) === String(currentUserId));
      setCurrentUserInClub(isInClub);
    }
  }, [currentUserId, clubMembers]);
  const getMemberName = (senderId: string) => {
    if (currentUserId && String(senderId) === String(currentUserId)) return 'You';
    const member = clubMembers.find(m => String(m.id) === String(senderId));
    return member ? member.name : 'Unknown Member';
  };
  const {
    normalizeMessage
  } = useMessageNormalization(currentUserId, getMemberName);
  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  if (!Array.isArray(messages)) {
    console.error("[ChatMessages] Messages is not an array:", messages);
    return <div className="flex-1 p-4">
        <div className="h-full flex items-center justify-center text-gray-500 text-sm">
          No messages yet. Start the conversation!
        </div>
      </div>;
  }
  const normalizedMessages = messages.map(message => normalizeMessage(message));
  return <div className="p-2 space-y-4 flex flex-col-reverse min-h-full">
      <div ref={messagesEndRef} />
      <MessageList messages={normalizedMessages.reverse()} clubMembers={clubMembers} isSupport={isSupport} onDeleteMessage={onDeleteMessage} onSelectUser={onSelectUser} formatTime={formatTime} currentUserAvatar={currentUserAvatar} />
    </div>;
};
export default ChatMessages;