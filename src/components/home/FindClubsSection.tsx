
import React from 'react';
import { Club } from '@/types';
import UserAvatar from '../shared/UserAvatar';

interface FindClubsSectionProps {
  clubs: Club[];
  onRequestJoin: (clubId: string, clubName: string) => void;
  onSearchClick: () => void;
  onCreateClick: () => void;
  onSelectClub?: (club: Club) => void;
}

const FindClubsSection: React.FC<FindClubsSectionProps> = ({ 
  clubs, 
  onRequestJoin, 
  onSearchClick, 
  onCreateClick,
  onSelectClub 
}) => {
  const featuredClubs = clubs.slice(0, 2);
  
  return (
    <div className="mt-8">
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-lg font-bold">Find Clubs</h2>
        <button 
          className="text-primary text-sm font-medium"
          onClick={onSearchClick}
        >
          Search All
        </button>
      </div>
      
      <div className="grid grid-cols-1 gap-3">
        {featuredClubs.map(club => (
          <div key={club.id} className="bg-white rounded-lg shadow p-3 flex items-center justify-between">
            <div className="flex items-center gap-3 flex-1">
              <UserAvatar 
                name={club.name} 
                image={club.logo} 
                size="sm" 
                className="h-10 w-10" 
              />
              <div>
                <h3 
                  className="font-medium hover:text-primary cursor-pointer"
                  onClick={() => onSelectClub?.(club)}
                >
                  {club.name}
                </h3>
                <p className="text-xs text-gray-500">{club.members.length} members</p>
              </div>
            </div>
            <button 
              className="text-xs bg-primary/10 text-primary px-3 py-1 rounded-full font-medium hover:bg-primary/20 transition-colors"
              onClick={() => onRequestJoin(club.id, club.name)}
            >
              Request to Join
            </button>
          </div>
        ))}
        
        <button 
          className="mt-2 w-full py-2 border border-dashed border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors"
          onClick={onCreateClick}
        >
          Create Your Own Club
        </button>
      </div>
    </div>
  );
};

export default FindClubsSection;
