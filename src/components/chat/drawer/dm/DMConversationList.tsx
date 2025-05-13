import React from 'react';
import { useDirectConversationsContext } from '@/context/DirectConversationsContext';
import { useUnreadMessages } from '@/context/unread-messages';
import UserAvatar from '@/components/shared/UserAvatar';
import { Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

// Update the lastMessage type in the ConversationItemProps
interface ConversationItemProps {
  key: string;
  conversationId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  lastMessage?: { text: string; timestamp: string };
  isSelected: boolean;
  isUnread: boolean;
  onSelect: () => void;
  isLoading?: boolean;
}

const ConversationItem: React.FC<ConversationItemProps> = React.memo(({
  conversationId,
  userId,
  userName,
  userAvatar,
  lastMessage,
  isSelected,
  isUnread,
  onSelect,
  isLoading
}) => {
  const formattedTime = lastMessage?.timestamp
    ? formatDistanceToNow(new Date(lastMessage.timestamp), { addSuffix: true })
    : null;

  return (
    <button
      onClick={onSelect}
      className={`w-full flex items-center space-x-3 p-4 hover:bg-gray-50 transition-colors ${
        isSelected ? 'bg-gray-100' : ''
      }`}
      disabled={isLoading}
    >
      <UserAvatar
        name={userName}
        image={userAvatar}
        size="md"
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <p className="font-medium truncate">{userName}</p>
          {formattedTime && (
            <span className="text-xs text-gray-500">
              {formattedTime}
            </span>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <Clock className="h-4 w-4 text-gray-400" />
          <p className="text-sm text-gray-500 truncate">
            {lastMessage ? lastMessage.text : "No messages yet"}
          </p>
          {isUnread && (
            <span className="ml-2 h-2 w-2 rounded-full bg-blue-500" />
          )}
        </div>
      </div>
    </button>
  );
});

interface DMConversationListProps {
  selectedConversation?: string;
  onSelectConversation: (conversation: { conversationId: string; userName: string; userAvatar?: string; userId: string, timestamp?: string, lastMessage?: string }) => void;
}

const DMConversationList: React.FC<DMConversationListProps> = ({
  selectedConversation,
  onSelectConversation
}) => {
  const { conversations, loading: isLoading } = useDirectConversationsContext();
  const { unreadConversations } = useUnreadMessages();

  const isUnread = (conversationId: string) => {
    return unreadConversations.has(conversationId);
  };

  const handleSelectConversation = (conversation: { conversationId: string; userName: string; userAvatar?: string; userId: string, timestamp?: string, lastMessage?: string }) => {
    onSelectConversation(conversation);
  };

  return (
    <div className="space-y-2">
      {conversations.map((conversation) => (
        <ConversationItem
          key={conversation.conversationId}
          conversationId={conversation.conversationId}
          userId={conversation.userId}
          userName={conversation.userName}
          userAvatar={conversation.userAvatar}
          lastMessage={conversation.lastMessage ? {
            text: conversation.lastMessage,
            timestamp: conversation.timestamp || ''
          } : undefined}
          isSelected={selectedConversation === conversation.conversationId}
          isUnread={isUnread(conversation.conversationId)}
          onSelect={() => handleSelectConversation(conversation)}
          isLoading={isLoading}
        />
      ))}

      {conversations.length === 0 && !isLoading && (
        <div className="flex items-center justify-center h-full">
          <p className="text-gray-500">No direct messages yet</p>
        </div>
      )}
    </div>
  );
};

export default DMConversationList;
