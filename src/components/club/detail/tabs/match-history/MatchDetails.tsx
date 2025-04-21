
import React from 'react';
import { Match } from '@/types';
import UserAvatar from '@/components/shared/UserAvatar';

interface MatchDetailsProps {
  match: Match;
  clubId: string;
  onSelectUser?: (userId: string, name: string, avatar?: string) => void;
}

const MatchDetails: React.FC<MatchDetailsProps> = ({ match, clubId, onSelectUser }) => {
  const homeClubWon = match.winner === 'home';

  return (
    <div className="px-4 py-3 bg-gray-50">
      <h4 className="font-semibold mb-2">Match Summary</h4>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <h5 className="text-sm font-medium mb-1">Home Club</h5>
          <div className="flex items-center gap-2">
            <UserAvatar name={match.homeClub.name} image={match.homeClub.logo} size="sm" />
            <div>
              <p className="text-xs font-medium">{match.homeClub.name}</p>
              <p className="text-xs text-gray-500">
                Total Distance: {match.homeClub.totalDistance.toFixed(1)} km
              </p>
            </div>
          </div>
          <div className="mt-2">
            <p className="text-xs font-medium mb-1">Top Performers:</p>
            {match.homeClub.members
              .sort((a, b) => (b.distanceContribution || 0) - (a.distanceContribution || 0))
              .slice(0, 3)
              .map((member) => (
                <div
                  key={member.id}
                  className="flex items-center gap-2 mb-1 cursor-pointer"
                  onClick={() => onSelectUser && onSelectUser(member.id, member.name, member.avatar)}
                >
                  <UserAvatar name={member.name} image={member.avatar} size="xs" />
                  <div>
                    <p className="text-xxs font-medium hover:text-primary">{member.name}</p>
                    <p className="text-xxs text-gray-500">
                      {member.distanceContribution?.toFixed(1)} km
                    </p>
                  </div>
                </div>
              ))}
          </div>
        </div>

        <div>
          <h5 className="text-sm font-medium mb-1">Away Club</h5>
          <div className="flex items-center gap-2">
            <UserAvatar name={match.awayClub.name} image={match.awayClub.logo} size="sm" />
            <div>
              <p className="text-xs font-medium">{match.awayClub.name}</p>
              <p className="text-xs text-gray-500">
                Total Distance: {match.awayClub.totalDistance.toFixed(1)} km
              </p>
            </div>
          </div>
          <div className="mt-2">
            <p className="text-xs font-medium mb-1">Top Performers:</p>
            {match.awayClub.members
              .sort((a, b) => (b.distanceContribution || 0) - (a.distanceContribution || 0))
              .slice(0, 3)
              .map((member) => (
                <div
                  key={member.id}
                  className="flex items-center gap-2 mb-1 cursor-pointer"
                  onClick={() => onSelectUser && onSelectUser(member.id, member.name, member.avatar)}
                >
                  <UserAvatar name={member.name} image={member.avatar} size="xs" />
                  <div>
                    <p className="text-xxs font-medium hover:text-primary">{member.name}</p>
                    <p className="text-xxs text-gray-500">
                      {member.distanceContribution?.toFixed(1)} km
                    </p>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>

      <div className="mt-4">
        <h5 className="text-sm font-medium mb-1">Match Result</h5>
        {match.winner ? (
          <p className="text-xs">
            {homeClubWon ? match.homeClub.name : match.awayClub.name} won the match!
          </p>
        ) : (
          <p className="text-xs">Match ended in a draw.</p>
        )}
      </div>
    </div>
  );
};

export default MatchDetails;

