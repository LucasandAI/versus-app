
import React from 'react';
import { ChatMessage } from '@/types/chat';
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
}

const ChatMessages: React.FC<ChatMessagesProps> = ({
  messages,
  clubMembers,
  isSupport = false,
  onDeleteMessage,
  onSelectUser
}) => {
  const { currentUserId, currentUserAvatar } = useMessageUser();
  const { currentUserInClub } = useCurrentMember(currentUserId, clubMembers);
  const { formatTime, getMemberName } = useMessageFormatting();
  const { scrollRef, lastMessageRef, scrollToBottom } = useMessageScroll(messages);
  
  const {
    normalizeMessage
  } = useMessageNormalization(currentUserId, (senderId) => getMemberName(senderId, currentUserId, clubMembers));

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
  
  return (
    <div 
      ref={scrollRef}
      className="flex-1 overflow-y-auto h-full"
    >
      <div className="flex flex-col pb-4">
        <MessageList 
          messages={normalizedMessages} 
          clubMembers={clubMembers} 
          isSupport={isSupport} 
          onDeleteMessage={onDeleteMessage} 
          onSelectUser={onSelectUser} 
          formatTime={formatTime} 
          currentUserAvatar={currentUserAvatar}
          currentUserId={currentUserId}
          lastMessageRef={lastMessageRef}
        />
      </div>
    </div>
  );
};

export default ChatMessages;
