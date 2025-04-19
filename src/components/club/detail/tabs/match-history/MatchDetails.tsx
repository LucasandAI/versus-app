
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
          {homeTeam.members && homeTeam.members.length > 0 ? (
            homeTeam.members.map((member) => (
              <div key={member.id} className="flex justify-between text-xs">
                <span>{member.name}</span>
                <span className="font-medium">
                  {member.distanceContribution !== undefined 
                    ? `${member.distanceContribution.toFixed(1)} km` 
                    : '0.0 km'}
                </span>
              </div>
            ))
          ) : (
            <div className="text-xs text-gray-500">No member data available</div>
          )}
        </div>
      </div>
      
      <div>
        <h4 className="text-xs font-semibold mb-2">{awayTeam.name} Members</h4>
        <div className="space-y-1">
          {awayTeam.members && awayTeam.members.length > 0 ? (
            awayTeam.members.map((member) => (
              <div key={member.id} className="flex justify-between text-xs">
                <span>{member.name}</span>
                <span className="font-medium">
                  {member.distanceContribution !== undefined 
                    ? `${member.distanceContribution.toFixed(1)} km` 
                    : '0.0 km'}
                </span>
              </div>
            ))
          ) : (
            <div className="text-xs text-gray-500">No member data available</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MatchDetails;
