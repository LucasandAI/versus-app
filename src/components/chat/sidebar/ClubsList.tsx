
import React from 'react';
import { Club } from '@/types';

interface ClubsListProps {
  clubs: Club[];
  selectedClubId?: string;
  onSelectClub: (club: Club) => void;
  onDeleteChat?: (chatId: string) => void;
  unreadClubs?: Set<string>;
}

const ClubsList: React.FC<ClubsListProps> = ({
  clubs,
  selectedClubId,
  onSelectClub,
  onDeleteChat,
  unreadClubs = new Set()
}) => {
  if (!clubs.length) {
    return (
      <div className="p-4 text-center text-gray-500">
        <p>No clubs available</p>
      </div>
    );
  }

  return (
    <div className="divide-y">
      {clubs.map((club) => {
        const isSelected = club.id === selectedClubId;
        const hasUnread = unreadClubs.has(club.id);
        
        return (
          <div
            key={club.id}
            className={`
              flex items-center p-3 cursor-pointer hover:bg-gray-50
              ${isSelected ? 'bg-gray-100' : ''}
              ${hasUnread ? 'font-semibold' : ''}
            `}
            onClick={() => onSelectClub(club)}
          >
            <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gray-200 overflow-hidden">
              {club.logo && (
                <img src={club.logo} alt={club.name} className="h-full w-full object-cover" />
              )}
            </div>
            <div className="ml-3 flex-1 flex justify-between items-center">
              <div className="text-sm font-medium">
                {club.name}
              </div>
              
              {hasUnread && (
                <div className="h-3 w-3 bg-red-500 rounded-full" />
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ClubsList;
