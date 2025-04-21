
import React from 'react';
import { ClubMember } from '@/types';
import UserAvatar from '@/components/shared/UserAvatar';
import { useApp } from '@/context/AppContext';

interface MatchDetailsProps {
  homeTeam: {
    name: string;
    members: ClubMember[];
  };
  awayTeam: {
    name: string;
    members: ClubMember[];
  };
  onSelectUser?: (userId: string, name: string, avatar?: string) => void;
  onSelectClub?: (clubId: string, clubName: string) => void;
}

const MatchDetails: React.FC<MatchDetailsProps> = ({ 
  homeTeam, 
  awayTeam,
  onSelectUser,
  onSelectClub 
}) => {
  const { setCurrentView, setSelectedClub } = useApp();

  const ensureTeamSize = (members: ClubMember[], teamName: string): ClubMember[] => {
    const result = [...members];
    
    // If we have fewer than 5 members, add placeholder members
    if (result.length < 5) {
      const existingMemberCount = result.length;
      for (let i = existingMemberCount; i < 5; i++) {
        const memberNumber = i + 1;
        result.push({
          id: `${teamName.toLowerCase()}-placeholder-${i}`,
          name: `Inactive Member ${memberNumber}`,
          avatar: '/placeholder.svg',
          isAdmin: false,
          distanceContribution: 0
        });
      }
    }
    
    return result;
  };

  const homeMembers = ensureTeamSize(homeTeam.members || [], homeTeam.name);
  const awayMembers = ensureTeamSize(awayTeam.members || [], awayTeam.name);

  const handleUserClick = (member: ClubMember) => {
    // Only allow clicking on real members, not placeholders
    if (!member.id.includes('placeholder') && onSelectUser) {
      onSelectUser(member.id, member.name, member.avatar);
    }
  };

  const handleClubClick = (clubId: string, clubName: string) => {
    if (onSelectClub) {
      onSelectClub(clubId, clubName);
    }
  };

  const renderMemberRow = (member: ClubMember) => (
    <div 
      key={member.id} 
      className="flex justify-between text-xs items-center"
    >
      <div 
        className={`flex items-center gap-2 ${!member.id.includes('placeholder') ? 'cursor-pointer hover:text-primary' : 'text-gray-400'}`}
        onClick={() => handleUserClick(member)}
      >
        <UserAvatar name={member.name} image={member.avatar} size="sm" />
        <span>{member.name}</span>
      </div>
      <span className="font-medium">
        {member.distanceContribution !== undefined 
          ? `${member.distanceContribution.toFixed(1)} km` 
          : '0.0 km'}
      </span>
    </div>
  );

  return (
    <div className="mt-3 bg-gray-50 p-3 rounded-md space-y-3">
      <div>
        <h4 
          className="text-xs font-semibold mb-2 cursor-pointer hover:text-primary"
          onClick={() => handleClubClick(homeTeam.name.toLowerCase(), homeTeam.name)}
        >
          {homeTeam.name} Members
        </h4>
        <div className="space-y-1">
          {homeMembers.map(renderMemberRow)}
        </div>
      </div>
      
      <div>
        <h4 
          className="text-xs font-semibold mb-2 cursor-pointer hover:text-primary"
          onClick={() => handleClubClick(awayTeam.name.toLowerCase(), awayTeam.name)}
        >
          {awayTeam.name} Members
        </h4>
        <div className="space-y-1">
          {awayMembers.map(renderMemberRow)}
        </div>
      </div>
    </div>
  );
};

export default MatchDetails;
