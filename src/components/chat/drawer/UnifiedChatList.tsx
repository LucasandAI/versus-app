import React from 'react';
import { Club } from '@/types';
import { useApp } from '@/context/AppContext';
import { useDirectConversationsContext } from '@/context/DirectConversationsContext';
import UserAvatar from '@/components/shared/UserAvatar';
import { MessageSquare, Users } from 'lucide-react';

interface UnifiedChatListProps {
  clubs: Club[];
  selectedChat: {
    type: 'club' | 'dm';
    id: string;
  } | null;
  onSelectChat: (type: 'club' | 'dm', id: string, name: string, avatar?: string) => void;
  unreadClubs?: Set<string>;
  unreadConversations?: Set<string>;
}

const UnifiedChatList: React.FC<UnifiedChatListProps> = ({
  clubs,
  selectedChat,
  onSelectChat,
  unreadClubs = new Set(),
  unreadConversations = new Set()
}) => {
  const { currentUser } = useApp();
  const { conversations = [] } = useDirectConversationsContext();

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* Club Chats Section */}
      <div className="p-4">
        <h3 className="text-sm font-semibold text-gray-500 mb-2">Club Chats</h3>
        <div className="space-y-2">
          {clubs.map((club) => (
            <button
              key={club.id}
              onClick={() => onSelectChat('club', club.id, club.name, club.logo)}
              className={`w-full flex items-center gap-3 p-2 rounded-lg transition-colors ${
                selectedChat?.type === 'club' && selectedChat.id === club.id
                  ? 'bg-primary/10'
                  : 'hover:bg-gray-100'
              }`}
            >
              <UserAvatar name={club.name} image={club.logo} size="sm" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="font-medium truncate">{club.name}</p>
                  {unreadClubs.has(club.id) && (
                    <span className="w-2 h-2 rounded-full bg-primary" />
                  )}
                </div>
                <p className="text-sm text-gray-500 truncate">
                  {club.members?.length || 0} members
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Direct Messages Section */}
      <div className="p-4 border-t">
        <h3 className="text-sm font-semibold text-gray-500 mb-2">Direct Messages</h3>
        <div className="space-y-2">
          {conversations.map((conversation) => {
            if (!conversation?.participants || !Array.isArray(conversation.participants)) {
              return null;
            }

            const otherUser = conversation.participants.find(
              (p) => p?.id !== currentUser?.id
            );
            if (!otherUser) return null;

            return (
              <button
                key={conversation.id}
                onClick={() =>
                  onSelectChat(
                    'dm',
                    conversation.id,
                    otherUser.name || 'Unknown User',
                    otherUser.avatar
                  )
                }
                className={`w-full flex items-center gap-3 p-2 rounded-lg transition-colors ${
                  selectedChat?.type === 'dm' && selectedChat.id === conversation.id
                    ? 'bg-primary/10'
                    : 'hover:bg-gray-100'
                }`}
              >
                <UserAvatar
                  name={otherUser.name || 'Unknown User'}
                  image={otherUser.avatar}
                  size="sm"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="font-medium truncate">{otherUser.name || 'Unknown User'}</p>
                    {unreadConversations.has(conversation.id) && (
                      <span className="w-2 h-2 rounded-full bg-primary" />
                    )}
                  </div>
                  <p className="text-sm text-gray-500 truncate">
                    {conversation.lastMessage?.text || 'No messages yet'}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default UnifiedChatList; 