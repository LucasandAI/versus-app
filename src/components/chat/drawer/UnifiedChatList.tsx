import React from 'react';
import { useApp } from '@/context/AppContext';
import { useDirectConversationsContext } from '@/context/DirectConversationsContext';
import { useUnreadMessages } from '@/context/unread-messages';
import { useClubLastMessages } from '@/hooks/chat/messages/useClubLastMessages';
import UserAvatar from '@/components/shared/UserAvatar';
import { MessageSquare, Users } from 'lucide-react';

interface UnifiedChatListProps {
  onSelectChat: (type: 'club' | 'dm', id: string, name: string, avatar?: string) => void;
  selectedChatId?: string;
  selectedChatType?: 'club' | 'dm';
}

const UnifiedChatList: React.FC<UnifiedChatListProps> = ({
  onSelectChat,
  selectedChatId,
  selectedChatType
}) => {
  const { currentUser } = useApp();
  const { conversations: directConversations = [], loading: loadingDMs } = useDirectConversationsContext();
  const { unreadMessages = new Set() } = useUnreadMessages();

  const userClubs = currentUser?.clubs || [];
  const { lastMessages, sortedClubs } = useClubLastMessages(userClubs);

  const isLoading = loadingDMs;
  const isEmpty = !isLoading && directConversations.length === 0 && userClubs.length === 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-500">Loading chats...</p>
      </div>
    );
  }

  if (isEmpty) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-500">No conversations yet</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Club Chats Section */}
      {sortedClubs.length > 0 && (
        <div className="mb-4">
          <h2 className="text-sm font-semibold text-gray-500 px-4 py-2">Club Chats</h2>
          {sortedClubs.map((club) => {
            const isSelected = selectedChatType === 'club' && selectedChatId === club.id;
            const hasUnread = unreadMessages.has(`club:${club.id}`);
            const lastMessage = lastMessages[club.id];
            
            return (
              <button
                key={club.id}
                onClick={() => onSelectChat('club', club.id, club.name, club.logo)}
                className={`w-full flex items-center space-x-3 p-4 hover:bg-gray-50 transition-colors ${
                  isSelected ? 'bg-gray-100' : ''
                }`}
              >
                <UserAvatar
                  name={club.name}
                  image={club.logo}
                  size="md"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="font-medium truncate">{club.name}</p>
                    {lastMessage?.timestamp && (
                      <span className="text-xs text-gray-500">
                        {new Date(lastMessage.timestamp).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <MessageSquare className="h-4 w-4 text-gray-400" />
                    <p className="text-sm text-gray-500 truncate">
                      {lastMessage ? (
                        <>
                          <span className="font-medium">{lastMessage.sender?.name}: </span>
                          {lastMessage.message}
                        </>
                      ) : (
                        `${club.members?.length || 0} members`
                      )}
                    </p>
                    {hasUnread && (
                      <span className="ml-2 h-2 w-2 rounded-full bg-blue-500" />
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Direct Messages Section */}
      {directConversations.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-gray-500 px-4 py-2">Direct Messages</h2>
          {directConversations.map((conversation) => {
            const isSelected = selectedChatType === 'dm' && selectedChatId === conversation.conversationId;
            const hasUnread = unreadMessages.has(`direct:${conversation.conversationId}`);
            
            return (
              <button
                key={conversation.conversationId}
                onClick={() => onSelectChat('dm', conversation.conversationId, conversation.userName, conversation.userAvatar)}
                className={`w-full flex items-center space-x-3 p-4 hover:bg-gray-50 transition-colors ${
                  isSelected ? 'bg-gray-100' : ''
                }`}
              >
                <UserAvatar
                  name={conversation.userName}
                  image={conversation.userAvatar}
                  size="md"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="font-medium truncate">{conversation.userName}</p>
                    {conversation.timestamp && (
                      <span className="text-xs text-gray-500">
                        {new Date(conversation.timestamp).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <MessageSquare className="h-4 w-4 text-gray-400" />
                    <p className="text-sm text-gray-500 truncate">
                      {conversation.lastMessage || 'No messages yet'}
                    </p>
                    {hasUnread && (
                      <span className="ml-2 h-2 w-2 rounded-full bg-blue-500" />
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default UnifiedChatList; 