
import React from 'react';
import { Club } from '@/types';
import UserAvatar from '../../shared/UserAvatar';
import { Trash2 } from 'lucide-react';
import ClubMembersPopover from './ClubMembersPopover';

interface ClubsListProps {
  clubs: Club[];
  selectedClub: Club | null;
  onSelectClub: (club: Club) => void;
  onDeleteChat?: (chatId: string, isTicket: boolean) => void;
  unreadCounts: Record<string, number>;
  onSelectUser: (userId: string, userName: string, userAvatar?: string) => void;
  setChatToDelete: (data: {id: string, name: string, isTicket: boolean} | null) => void;
}

const ClubsList: React.FC<ClubsListProps> = ({
  clubs,
  selectedClub,
  onSelectClub,
  onDeleteChat,
  unreadCounts,
  onSelectUser,
  setChatToDelete,
}) => {
  const MAX_MEMBERS = 5;

  return (
    <div className="p-3">
      <h3 className="text-sm font-medium mb-2">Your Clubs</h3>
      
      <div className="space-y-1">
        {clubs.map((club) => (
          <div key={club.id} className="flex flex-col relative group">
            <button
              className={`w-full flex items-center p-2 rounded-md text-left transition-colors ${
                selectedClub?.id === club.id 
                  ? 'bg-primary/10 text-primary'
                  : 'hover:bg-gray-100'
              }`}
              onClick={() => onSelectClub(club)}
            >
              <div className="flex-shrink-0 mr-2">
                <UserAvatar 
                  name={club.name} 
                  image={club.logo || ''} 
                  size="sm"
                />
              </div>
              <div className="flex-1 overflow-hidden">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium truncate">{club.name}</p>
                  {unreadCounts[club.id] > 0 && (
                    <span className="ml-1 bg-red-500 text-white text-[10px] rounded-full h-4 w-4 flex items-center justify-center">
                      {unreadCounts[club.id] > 9 ? '9+' : unreadCounts[club.id]}
                    </span>
                  )}
                </div>
                <ClubMembersPopover 
                  club={club}
                  onSelectUser={onSelectUser}
                />
              </div>
            </button>
            {onDeleteChat && (
              <button 
                className="absolute right-1 top-1/2 -translate-y-1/2 w-6 h-6 bg-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-gray-100"
                onClick={() => setChatToDelete({
                  id: club.id,
                  name: club.name,
                  isTicket: false
                })}
              >
                <Trash2 className="h-3 w-3 text-gray-500 hover:text-red-500" />
              </button>
            )}
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
