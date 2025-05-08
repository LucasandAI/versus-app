
import React from 'react';
import { Club } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

interface ClubsListProps {
  clubs: Club[];
  selectedClub: Club | null;
  onSelectClub: (club: Club) => void;
  unreadClubs: Set<string>;
}

const ClubsList: React.FC<ClubsListProps> = ({
  clubs,
  selectedClub,
  onSelectClub,
  unreadClubs
}) => {
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };
  
  if (clubs.length === 0) {
    return (
      <div className="p-4 text-center text-gray-500">
        <p>No clubs found</p>
      </div>
    );
  }
  
  return (
    <div className="py-2">
      {clubs.map(club => (
        <div
          key={club.id}
          onClick={() => onSelectClub(club)}
          className={`
            flex items-center p-3 cursor-pointer transition-colors
            ${selectedClub?.id === club.id ? 'bg-gray-100' : 'hover:bg-gray-50'}
            ${unreadClubs.has(club.id) ? 'font-medium' : ''}
          `}
        >
          <Avatar className="h-10 w-10 mr-3">
            <AvatarImage src={club.logo || '/placeholder.svg'} alt={club.name} />
            <AvatarFallback>{getInitials(club.name)}</AvatarFallback>
          </Avatar>
          
          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-center">
              <p className="text-sm font-medium truncate">{club.name}</p>
              {unreadClubs.has(club.id) && (
                <Badge variant="default" className="ml-2 h-5 w-5 rounded-full p-0 flex items-center justify-center">
                  •
                </Badge>
              )}
            </div>
            <p className="text-xs text-gray-500 truncate">
              {club.division} - Tier {club.tier}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ClubsList;
