
import React from 'react';
import { Club } from '@/types';
import { formatDistanceToNow } from 'date-fns';
import UserAvatar from '@/components/shared/UserAvatar';
import { useClubLastMessages } from '@/hooks/chat/messages/useClubLastMessages';

interface ChatSidebarContentProps {
  clubs: Club[];
  selectedClub: Club | null;
  onSelectClub: (club: Club) => void;
  onDeleteChat?: (chatId: string) => void;
  unreadCounts?: Record<string, number>;
  onSelectUser: (userId: string, userName: string, userAvatar?: string) => void;
  activeTab: "clubs" | "dm";
  clubMessages?: Record<string, any[]>;
}

const ChatSidebarContent: React.FC<ChatSidebarContentProps> = ({
  clubs,
  selectedClub,
  onSelectClub,
  unreadCounts = {},
  onSelectUser
}) => {
  const lastMessages = useClubLastMessages(clubs);

  const truncateMessage = (text: string) => {
    return text?.length > 50 ? `${text.substring(0, 50)}...` : text;
  };

  return (
    <div className="flex flex-col h-full bg-white">
      <h1 className="text-4xl font-bold p-4">Club Chats</h1>
      
      <div className="flex-1 overflow-auto">
        {clubs.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            <p className="text-lg">No clubs yet</p>
            <p className="text-sm mt-1">Join a club to start chatting</p>
          </div>
        ) : (
          <div className="divide-y">
            {clubs.map(club => {
              const lastMessage = lastMessages[club.id];
              const formattedTime = lastMessage?.timestamp 
                ? formatDistanceToNow(new Date(lastMessage.timestamp), { addSuffix: false })
                : '';
              
              return (
                <button
                  key={club.id}
                  onClick={() => onSelectClub(club)}
                  className="w-full p-4 flex items-start gap-3 hover:bg-gray-50 transition-colors text-left"
                >
                  <UserAvatar
                    name={club.name}
                    image={club.logo || ''}
                    size="lg"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline">
                      <p className="font-medium truncate">{club.name}</p>
                      {formattedTime && (
                        <span className="ml-2 text-sm text-gray-500">
                          {formattedTime}
                        </span>
                      )}
                    </div>
                    {lastMessage ? (
                      <p className="text-sm text-gray-600 truncate">
                        <span className="font-medium">{lastMessage.sender?.name || 'Unknown'}: </span>
                        {truncateMessage(lastMessage.message)}
                      </p>
                    ) : (
                      <p className="text-sm text-gray-600">
                        No messages yet
                      </p>
                    )}
                  </div>
                  {unreadCounts[club.id] > 0 && (
                    <span className="bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                      {unreadCounts[club.id] > 9 ? '9+' : unreadCounts[club.id]}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatSidebarContent;
