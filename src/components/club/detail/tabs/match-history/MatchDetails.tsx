
import React from 'react';
import { ClubMember } from '@/types';

interface MatchDetailsProps {
  homeTeam: {
    name: string;
    members: ClubMember[];
  };
  awayTeam: {
    name: string;
    members: ClubMember[];
  };
}

const MatchDetails: React.FC<MatchDetailsProps> = ({ homeTeam, awayTeam }) => {
  return (
    <div className="mt-3 bg-gray-50 p-3 rounded-md space-y-3">
      <div>
        <h4 className="text-xs font-semibold mb-2">{homeTeam.name} Members</h4>
        <div className="space-y-1">
          {homeTeam.members.map((member) => (
            <div key={member.id} className="flex justify-between text-xs">
              <span>{member.name}</span>
              <span className="font-medium">{member.distanceContribution?.toFixed(1)} km</span>
            </div>
          ))}
        </div>
      </div>
      
      <div>
        <h4 className="text-xs font-semibold mb-2">{awayTeam.name} Members</h4>
        <div className="space-y-1">
          {awayTeam.members.map((member) => (
            <div key={member.id} className="flex justify-between text-xs">
              <span>{member.name}</span>
              <span className="font-medium">{member.distanceContribution?.toFixed(1)} km</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MatchDetails;
