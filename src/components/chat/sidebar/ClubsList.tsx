
import React, { useEffect } from 'react';
import { Club } from '@/types';
import UserAvatar from '../../shared/UserAvatar';
import ClubMembersPopover from './ClubMembersPopover';
import { useNavigation } from '@/hooks/useNavigation';
import { formatDistanceToNow } from 'date-fns';
import { useClubLastMessages } from '@/hooks/chat/messages/useClubLastMessages';
import { useUnreadMessages } from '@/context/UnreadMessagesContext';
import { Badge } from '@/components/ui/badge';

interface ClubsListProps {
  clubs: Club[];
  selectedClub: Club | null;
  onSelectClub: (club: Club) => void;
  unreadCounts: Record<string, number>;
  onSelectUser: (userId: string, userName: string, userAvatar?: string) => void;
  setChatToDelete: (data: {
    id: string;
    name: string;
    isTicket: boolean;
  } | null) => void;
}

const ClubsList: React.FC<ClubsListProps> = ({
  clubs,
  selectedClub,
  onSelectClub,
  onSelectUser,
  setChatToDelete,
}) => {
  const { navigateToClubDetail } = useNavigation();
  const { lastMessages, sortedClubs } = useClubLastMessages(clubs);
  const { unreadClubs, markClubMessagesAsRead } = useUnreadMessages();
  
  const handleClubClick = (club: Club, e: React.MouseEvent) => {
    e.preventDefault();
    onSelectClub(club);
    markClubMessagesAsRead(club.id);
    console.log('[ClubsList] Club selected for chat:', club.id);
  };

  const truncateMessage = (text: string) => {
    return text?.length > 50 ? `${text.substring(0, 50)}...` : text;
  };

  return (
    <div className="p-3">
      <h3 className="text-sm font-medium mb-2">Your Clubs</h3>
      
      <div className="space-y-1">
        {sortedClubs.map(club => {
          const lastMessage = lastMessages[club.id];
          const formattedTime = lastMessage?.timestamp 
            ? formatDistanceToNow(new Date(lastMessage.timestamp), { addSuffix: false })
            : '';
          const isUnread = unreadClubs.has(club.id);
            
          return (
            <div key={club.id} className="flex flex-col relative group">
              <button 
                className={`w-full flex items-center p-3 rounded-md text-left transition-colors ${
                  selectedClub?.id === club.id ? 'bg-primary/10 text-primary' : 'hover:bg-gray-100'
                }`} 
                onClick={(e) => handleClubClick(club, e)}
              >
                <div className="flex-shrink-0 mr-3 relative">
                  <UserAvatar name={club.name} image={club.logo || ''} size="lg" />
                  {isUnread && (
                    <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline">
                    <p className={`truncate text-lg ${isUnread ? 'font-bold' : 'font-medium'}`}>
                      {club.name}
                      {isUnread && (
                        <span className="ml-2 inline-flex h-2 w-2 bg-red-500 rounded-full" />
                      )}
                    </p>
                    {formattedTime && (
                      <span className={`ml-2 text-xs ${isUnread ? 'font-bold' : 'text-gray-500'}`}>
                        {formattedTime}
                      </span>
                    )}
                  </div>
                  
                  <div className="flex items-center justify-between mt-1">
                    {lastMessage ? (
                      <p className={`text-sm ${isUnread ? 'font-semibold text-gray-900' : 'text-gray-600'} truncate pr-2`}>
                        <span className="font-medium">{lastMessage.sender?.name || 'Unknown'}: </span>
                        {truncateMessage(lastMessage.message)}
                      </p>
                    ) : (
                      <p className="text-sm text-gray-600 truncate pr-2">
                        No messages yet
                      </p>
                    )}
                    {isUnread && (
                      <Badge variant="destructive" className="ml-1 h-5 min-w-5 flex items-center justify-center rounded-full p-1">
                        •
                      </Badge>
                    )}
                  </div>
                  
                  <ClubMembersPopover club={club} onSelectUser={onSelectUser} />
                </div>
              </button>
            </div>
          );
        })}
        
        {clubs.length === 0 && (
          <div className="text-center py-4 text-sm text-gray-500">
            You don't have any clubs yet
          </div>
        )}
      </div>
    </div>
  );
};

export default ClubsList;
