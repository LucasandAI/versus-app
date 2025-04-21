
import React from 'react';
import { Match } from '@/types';
import UserAvatar from '@/components/shared/UserAvatar';
import { ChevronUp } from 'lucide-react';

interface MatchDetailsProps {
  match: Match;
  clubId: string;
  onSelectUser?: (userId: string, name: string, avatar?: string) => void;
}

const MatchDetails: React.FC<MatchDetailsProps> = ({ match, clubId, onSelectUser }) => {
  const homeClubWon = match.winner === 'home';
  const awayClubWon = match.winner === 'away';
  
  // Format date range for the match
  const formatDateRange = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    return `${start.toLocaleDateString('en-US', { month: 'long' })} ${start.getDate()}–${end.getDate()}, ${end.getFullYear()}`;
  };

  // Determine if the user's club won
  const userClubIsHome = clubId === match.homeClub.id;
  const userClubWon = (userClubIsHome && homeClubWon) || (!userClubIsHome && awayClubWon);
  
  // Get promotion/relegation information if available
  const getLeagueImpact = () => {
    if (!match.leagueBeforeMatch || !match.leagueAfterMatch) return null;
    
    const before = match.leagueBeforeMatch;
    const after = match.leagueAfterMatch;
    
    if (before.division !== after.division || before.tier !== after.tier) {
      if ((after.division === before.division && after.tier! < before.tier!) || 
          (after.division !== before.division)) {
        return `Promoted to ${after.division} ${after.tier}`;
      } else if (after.tier! > before.tier!) {
        return `Relegated to ${after.division} ${after.tier}`;
      }
    }
    
    return null;
  };
  
  const leagueImpact = getLeagueImpact();

  return (
    <div className="bg-white">
      <div className="p-4">
        {/* Match Date and Teams */}
        <p className="text-gray-600 mb-2">
          {formatDateRange(match.startDate, match.endDate)}
        </p>
        
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">
            {match.homeClub.name} <span className="text-gray-400 font-normal">vs</span> {match.awayClub.name}
          </h3>
          
          {match.winner && (
            <span className={`px-3 py-1 rounded-full text-sm ${userClubWon ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
              {userClubWon ? 'WIN' : 'LOSS'}
            </span>
          )}
        </div>
        
        {/* Distance Bar */}
        <div className="flex h-6 rounded-full overflow-hidden mb-4">
          <div 
            className="bg-primary text-white flex justify-center items-center text-xs px-2"
            style={{ width: `${(match.homeClub.totalDistance / (match.homeClub.totalDistance + match.awayClub.totalDistance) * 100)}%` }}
          >
            {match.homeClub.totalDistance.toFixed(1)} km
          </div>
          <div 
            className="bg-gray-800 text-white flex justify-center items-center text-xs px-2"
            style={{ width: `${(match.awayClub.totalDistance / (match.homeClub.totalDistance + match.awayClub.totalDistance) * 100)}%` }}
          >
            {match.awayClub.totalDistance.toFixed(1)} km
          </div>
        </div>
        
        {/* League Impact */}
        {leagueImpact && (
          <div className="mb-4">
            <p className="text-sm">
              <span className="text-gray-600">League Impact:</span> <span className="text-primary">{leagueImpact}</span>
            </p>
          </div>
        )}
        
        {/* Toggle Details Button */}
        <button className="w-full border rounded-md py-2 flex items-center justify-center text-sm text-gray-600">
          <ChevronUp className="h-4 w-4 mr-1" />
          Hide Match Details
        </button>
      </div>
      
      {/* Members Lists */}
      <div className="px-4 py-3 bg-gray-50">
        {/* Away Club Members */}
        <h4 className="font-semibold mb-3">{match.homeClub.name} Members</h4>
        <div className="space-y-2 mb-6">
          {match.homeClub.members
            .sort((a, b) => (b.distanceContribution || 0) - (a.distanceContribution || 0))
            .map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between cursor-pointer"
                onClick={() => onSelectUser && onSelectUser(member.id, member.name, member.avatar)}
              >
                <div className="flex items-center">
                  <UserAvatar name={member.name} image={member.avatar} size="sm" />
                  <span className="ml-3 hover:text-primary">{member.name}</span>
                </div>
                <span className="font-medium">
                  {member.distanceContribution ? member.distanceContribution.toFixed(1) : '0.0'} km
                </span>
              </div>
            ))}
        </div>
        
        {/* Home Club Members */}
        <h4 className="font-semibold mb-3">{match.awayClub.name} Members</h4>
        <div className="space-y-2">
          {match.awayClub.members
            .sort((a, b) => (b.distanceContribution || 0) - (a.distanceContribution || 0))
            .map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between cursor-pointer"
                onClick={() => onSelectUser && onSelectUser(member.id, member.name, member.avatar)}
              >
                <div className="flex items-center">
                  <UserAvatar name={member.name} image={member.avatar} size="sm" />
                  <span className="ml-3 hover:text-primary">{member.name}</span>
                </div>
                <span className="font-medium">
                  {member.distanceContribution ? member.distanceContribution.toFixed(1) : '0.0'} km
                </span>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
};

export default MatchDetails;
