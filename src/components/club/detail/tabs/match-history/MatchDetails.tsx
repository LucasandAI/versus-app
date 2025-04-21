
import React from 'react';
import { ClubMember } from '@/types';
import UserAvatar from '@/components/shared/UserAvatar';

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
}

const MatchDetails: React.FC<MatchDetailsProps> = ({ 
  homeTeam, 
  awayTeam,
  onSelectUser 
}) => {
  // Ensure each team has exactly 5 members
  const ensureTeamSize = (members: ClubMember[], teamName: string): ClubMember[] => {
    const result = [...members];
    
    // If we have fewer than 5 members, add placeholder members
    if (result.length < 5) {
      for (let i = result.length; i < 5; i++) {
        result.push({
          id: `${teamName}-member-${i}`,
          name: `${teamName} Member ${i + 1}`,
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
    if (onSelectUser) {
      onSelectUser(member.id, member.name, member.avatar);
    }
  };

  return (
    <div className="mt-3 bg-gray-50 p-3 rounded-md space-y-3">
      <div>
        <h4 className="text-xs font-semibold mb-2">{homeTeam.name} Members</h4>
        <div className="space-y-1">
          {homeMembers.map((member) => (
            <div 
              key={member.id} 
              className="flex justify-between text-xs items-center"
            >
              <div 
                className="flex items-center gap-2 cursor-pointer hover:text-primary"
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
          ))}
        </div>
      </div>
      
      <div>
        <h4 className="text-xs font-semibold mb-2">{awayTeam.name} Members</h4>
        <div className="space-y-1">
          {awayMembers.map((member) => (
            <div 
              key={member.id} 
              className="flex justify-between text-xs items-center"
            >
              <div 
                className="flex items-center gap-2 cursor-pointer hover:text-primary"
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
          ))}
        </div>
      </div>
    </div>
  );
};

export default MatchDetails;
