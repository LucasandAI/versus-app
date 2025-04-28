import React from 'react';
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
  formatTime: providedFormatTime
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

  // Use provided values or defaults
  const finalUserAvatar = providedUserAvatar || defaultUserAvatar;
  const finalLastMessageRef = providedLastMessageRef || defaultLastMessageRef;
  const finalFormatTime = providedFormatTime || defaultFormatTime;
  if (!Array.isArray(messages)) {
    return <div className="flex-1 p-4">
        <div className="h-full flex items-center justify-center text-gray-500 text-sm">
          No messages yet. Start the conversation!
        </div>
      </div>;
  }
  const normalizedMessages = messages.map(message => normalizeMessage(message));
  return <div ref={scrollRef} className="mb-2 px-0 py-[10px]">
      {messages.length === 0 ? (
        <div className="h-full flex items-center justify-center text-gray-500 text-sm py-4">
          No messages yet. Start the conversation!
        </div>
      ) : (
        messages.map((message: ChatMessage, index: number) => {
          // Improved logic to determine if a message is from the current user
          const isUserMessage = currentUserId && 
                               message.sender && 
                               String(message.sender.id) === String(currentUserId);
          const isLastMessage = index === messages.length - 1;
          
          return (
            <div 
              key={message.id} 
              ref={isLastMessage ? finalLastMessageRef : undefined}
              className="mb-4"
            >
              <MessageList messages={normalizedMessages} clubMembers={clubMembers} isSupport={isSupport} onDeleteMessage={onDeleteMessage} onSelectUser={onSelectUser} formatTime={finalFormatTime} currentUserAvatar={finalUserAvatar} currentUserId={currentUserId} lastMessageRef={finalLastMessageRef} />
            </div>
          );
        })
      )}
    </div>;
};
export default ChatMessages;
