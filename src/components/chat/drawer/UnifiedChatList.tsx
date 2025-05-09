import React from 'react';
import { useApp } from '@/context/AppContext';
import { useDirectConversationsContext } from '@/context/DirectConversationsContext';
import { Skeleton } from '@/components/ui/skeleton';
import { useUnreadMessages } from '@/context/unread-messages';
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
  const isLoading = loadingDMs;
  const isEmpty = !isLoading && directConversations.length === 0 && userClubs.length === 0;

  if (isLoading) {
    return (
      <div className="flex flex-col h-full bg-white">
        <h1 className="text-4xl font-bold p-4">Messages</h1>
        <div className="flex-1 overflow-auto">
          <div className="p-4 space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center space-x-3 p-2">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-full" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (isEmpty) {
    return (
      <div className="flex flex-col h-full bg-white">
        <h1 className="text-4xl font-bold p-4">Messages</h1>
        <div className="flex-1 flex items-center justify-center">
          <p className="text-gray-500">No conversations yet</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white">
      <h1 className="text-4xl font-bold p-4">Messages</h1>
      <div className="flex-1 overflow-auto">
        {/* Club Chats Section */}
        {userClubs.length > 0 && (
          <div className="mb-4">
            <h2 className="text-sm font-semibold text-gray-500 px-4 py-2">Club Chats</h2>
            {userClubs.map((club) => {
              const isSelected = selectedChatType === 'club' && selectedChatId === club.id;
              const hasUnread = unreadMessages.has(club.id);
              
              return (
                <button
                  key={club.id}
                  onClick={() => onSelectChat('club', club.id, club.name, club.logo)}
                  className={`w-full flex items-center space-x-3 p-4 hover:bg-gray-50 transition-colors ${
                    isSelected ? 'bg-gray-100' : ''
                  }`}
                >
                  <UserAvatar
                    user={{ 
                      id: club.id, 
                      name: club.name, 
                      avatar: club.logo || '/placeholder.svg'
                    }}
                    size="md"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="font-medium truncate">{club.name}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Users className="h-4 w-4 text-gray-400" />
                      <p className="text-sm text-gray-500 truncate">
                        {club.members?.length || 0} members
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
              const hasUnread = unreadMessages.has(conversation.conversationId);
              
              return (
                <button
                  key={conversation.conversationId}
                  onClick={() => onSelectChat('dm', conversation.conversationId, conversation.userName, conversation.userAvatar)}
                  className={`w-full flex items-center space-x-3 p-4 hover:bg-gray-50 transition-colors ${
                    isSelected ? 'bg-gray-100' : ''
                  }`}
                >
                  <UserAvatar
                    user={{ 
                      id: conversation.userId, 
                      name: conversation.userName, 
                      avatar: conversation.userAvatar || '/placeholder.svg'
                    }}
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
    </div>
  );
};

export default UnifiedChatList; 