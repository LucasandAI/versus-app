
import React from 'react';
import { formatLeagueWithTier } from '@/lib/format';
import UserAvatar from '@/components/shared/UserAvatar';
import { Club } from '@/types';

interface ClubHeaderInfoProps {
  club: Club;
  memberCount: number;
}

const ClubHeaderInfo: React.FC<ClubHeaderInfoProps> = ({ club, memberCount }) => {
  // Safely handle potentially undefined club properties with fallbacks
  const clubName = club?.name || 'Unnamed Club';
  const clubLogo = club?.logo || '/placeholder.svg';
  const division = club?.division || 'bronze';
  const tier = typeof club?.tier === 'number' ? club.tier : 5;

  return (
    <div className="flex flex-col items-center md:items-start mb-4 md:mb-0">
      <div className="mb-4">
        <UserAvatar 
          name={clubName} 
          image={clubLogo} 
          size="lg"
          className="h-24 w-24 border-4 border-white shadow-md"
        />
      </div>
      <h2 className="text-2xl font-bold text-center md:text-left">{clubName}</h2>
      <div className="flex items-center mt-2 space-x-2">
        <span className="text-sm bg-gray-100 px-2 py-1 rounded-full text-gray-700 font-medium">
          {formatLeagueWithTier(division, tier)}
        </span>
        <span className="text-sm bg-gray-100 px-2 py-1 rounded-full text-gray-700">
          {`${memberCount}/5 members`}
        </span>
      </div>
    </div>
  );
};

export default ClubHeaderInfo;
