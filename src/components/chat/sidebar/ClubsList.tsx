
import React from 'react';
import { Club } from '@/types';
import UserAvatar from '../../shared/UserAvatar';
import ClubMembersPopover from './ClubMembersPopover';
import { useNavigation } from '@/hooks/useNavigation';

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
}

const ClubsList: React.FC<ClubsListProps> = ({
  clubs,
  selectedClub,
  onSelectClub,
  unreadCounts,
  onSelectUser,
  setChatToDelete
}) => {
  const { navigateToClubDetail } = useNavigation();
  
  const handleClubClick = (club: Club) => {
    // First set the selected club for the chat context
    onSelectClub(club);
    
    // Also set up navigation to the club detail if needed
    // This makes the club data available in other parts of the app
    navigateToClubDetail(club.id, club);
  };

  return (
    <div className="p-3">
      <h3 className="text-sm font-medium mb-2">Your Clubs</h3>
      
      <div className="space-y-1">
        {clubs.map(club => (
          <div key={club.id} className="flex flex-col relative group">
            <button 
              className={`w-full flex items-center p-2 rounded-md text-left transition-colors ${
                selectedClub?.id === club.id ? 'bg-primary/10 text-primary' : 'hover:bg-gray-100'
              }`} 
              onClick={() => handleClubClick(club)}
            >
              <div className="flex-shrink-0 mr-2">
                <UserAvatar name={club.name} image={club.logo || ''} size="sm" />
              </div>
              <div className="flex-1 overflow-hidden">
                <div className="flex items-center justify-between">
                  <p className="font-medium truncate text-lg">{club.name}</p>
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
        ))}
        
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
