
import React from 'react';
import { Club } from '@/types';
import UserAvatar from '../../shared/UserAvatar';
import ClubMembersPopover from './ClubMembersPopover';
import { useNavigation } from '@/hooks/useNavigation';
import { formatDistanceToNow } from 'date-fns';

interface ClubsListProps {
  clubs: Club[];
  selectedClub: Club | null;
  onSelectClub: (club: Club) => void;
  onDeleteChat?: (chatId: string, isTicket: boolean) => void;
  unreadCounts: Record<string, number>;
  onSelectUser: (userId: string, userName: string, userAvatar?: string) => void;
  setChatToDelete: (data: {
    id: string;
    name: string;
    isTicket: boolean;
  } | null) => void;
  clubMessages?: Record<string, any[]>;  // Add this prop to receive messages
}

const ClubsList: React.FC<ClubsListProps> = ({
  clubs,
  selectedClub,
  onSelectClub,
  unreadCounts,
  onSelectUser,
  setChatToDelete,
  clubMessages = {} // Default to empty object if not provided
}) => {
  const { navigateToClubDetail } = useNavigation();
  
  const handleClubClick = (club: Club, e: React.MouseEvent) => {
    e.preventDefault();
    onSelectClub(club);
    console.log('[ClubsList] Club selected for chat:', club.id);
  };

  return (
    <div className="p-3">
      <h3 className="text-sm font-medium mb-2">Your Clubs</h3>
      
      <div className="space-y-1">
        {clubs.map(club => {
          const clubId = club.id;
          const messages = clubMessages[clubId] || [];
          const lastMessage = messages.length > 0 ? messages[messages.length - 1] : null;
          const formattedTime = lastMessage?.timestamp 
            ? formatDistanceToNow(new Date(lastMessage.timestamp), { addSuffix: false })
            : '';
            
          return (
            <div key={club.id} className="flex flex-col relative group">
              <button 
                className={`w-full flex items-center p-3 rounded-md text-left transition-colors ${
                  selectedClub?.id === club.id ? 'bg-primary/10 text-primary' : 'hover:bg-gray-100'
                }`} 
                onClick={(e) => handleClubClick(club, e)}
              >
                <div className="flex-shrink-0 mr-3">
                  <UserAvatar name={club.name} image={club.logo || ''} size="lg" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline">
                    <p className="font-medium truncate text-lg">{club.name}</p>
                    {formattedTime && (
                      <span className="ml-2 text-sm text-gray-500">
                        {formattedTime}
                      </span>
                    )}
                  </div>
                  
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-sm text-gray-600 truncate pr-2">
                      {lastMessage?.message || "No messages yet"}
                    </p>
                    {unreadCounts[club.id] > 0 && (
                      <span className="ml-1 bg-red-500 text-white text-[10px] rounded-full h-4 w-4 flex items-center justify-center">
                        {unreadCounts[club.id] > 9 ? '9+' : unreadCounts[club.id]}
                      </span>
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
