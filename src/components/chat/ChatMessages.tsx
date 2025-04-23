
import React from 'react';
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
  onSelectUser,
}) => {
  const { currentUserId, currentUserAvatar } = useMessageUser();
  
  const getMemberName = (senderId: string) => {
    if (currentUserId && String(senderId) === String(currentUserId)) return 'You';
    const member = clubMembers.find(m => String(m.id) === String(senderId));
    return member ? member.name : 'Unknown Member';
  };

  const { normalizeMessage } = useMessageNormalization(currentUserId, getMemberName);
  
  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (!Array.isArray(messages)) {
    console.error("[ChatMessages] Messages is not an array:", messages);
    return (
      <div className="flex-1 overflow-y-auto p-4 bg-white">
        <div className="h-full flex items-center justify-center text-gray-500 text-sm">
          No messages yet. Start the conversation!
        </div>
      </div>
    );
  }

  const normalizedMessages = messages.map(message => normalizeMessage(message));

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-white">
      <MessageList
        messages={normalizedMessages}
        clubMembers={clubMembers}
        isSupport={isSupport}
        onDeleteMessage={onDeleteMessage}
        onSelectUser={onSelectUser}
        formatTime={formatTime}
        currentUserAvatar={currentUserAvatar}
      />
    </div>
  );
};

export default ChatMessages;
