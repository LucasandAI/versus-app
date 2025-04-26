
import React from 'react';
import { Club } from '@/types';
import UserAvatar from '@/components/shared/UserAvatar';

interface ClubHeaderInfoProps {
  club: Club;
  memberCount: number;
  isAdmin?: boolean;
}

const ClubHeaderInfo: React.FC<ClubHeaderInfoProps> = ({ 
  club,
  memberCount,
  isAdmin 
}) => {
  return (
    <div className="flex flex-col items-center md:items-start">
      <div className="mb-4">
        <UserAvatar
          name={club.name}
          image={club.logo}
          size="lg"
        />
      </div>
      
      <div className="text-center md:text-left">
        <h1 className="text-2xl font-bold mb-2">{club.name}</h1>
        
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600">
            {memberCount}/5 members
          </span>
        </div>
      </div>
    </div>
  );
};

export default ClubHeaderInfo;
