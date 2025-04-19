
import React from 'react';
import { Match } from '@/types';
import { ChevronDown, ChevronUp } from "lucide-react";
import MatchProgressBar from '@/components/shared/MatchProgressBar';
import { formatLeague, getDivisionEmoji } from '@/utils/club/leagueUtils';
import MatchDetails from './MatchDetails';

interface MatchCardProps {
  match: Match;
  clubId: string;
  expandedMatchId: string | null;
  onExpandToggle: (matchId: string) => void;
}

const MatchCard: React.FC<MatchCardProps> = ({ 
  match, 
  clubId, 
  expandedMatchId, 
  onExpandToggle 
}) => {
  const isHomeTeam = match.homeClub.id === clubId;
  const ourTeam = isHomeTeam ? match.homeClub : match.awayClub;
  const theirTeam = isHomeTeam ? match.awayClub : match.homeClub;
  const weWon = (isHomeTeam && match.winner === 'home') || (!isHomeTeam && match.winner === 'away');

  // Format date in a readable way
  const formatDateRange = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    return `${start.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}–${end.getDate()}, ${end.getFullYear()}`;
  };

  const getLeagueImpactText = (match: Match, clubId: string) => {
    if (!match.leagueAfterMatch) return 'No impact';
    
    const isHomeTeam = match.homeClub.id === clubId;
    const weWon = (isHomeTeam && match.winner === 'home') || (!isHomeTeam && match.winner === 'away');
    
    const emoji = getDivisionEmoji(match.leagueAfterMatch.division);
    const formattedLeague = formatLeague(match.leagueAfterMatch.division, match.leagueAfterMatch.tier);
    
    const pointsInfo = match.leagueAfterMatch.division === 'Elite' && match.leagueAfterMatch.elitePoints !== undefined
      ? ` (${match.leagueAfterMatch.elitePoints} points)`
      : '';
      
    let actionText = 'Stayed in';
    if (weWon) {
      actionText = 'Promoted to';
    } else {
      actionText = 'Relegated to';
    }
    
    return `${actionText} ${emoji} ${formattedLeague}${pointsInfo}`;
  };

  const dateRange = formatDateRange(match.startDate, match.endDate);

  return (
    <div className="space-y-2 pb-3 border-b border-gray-100 last:border-0">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-gray-600">{dateRange}</p>
          <div className="flex items-center gap-2 mt-1">
            <h3 className="text-sm font-medium">{ourTeam.name}</h3>
            <span className="text-gray-500 text-xs">vs</span>
            <h3 className="text-sm font-medium">{theirTeam.name}</h3>
          </div>
        </div>
        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
          weWon ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {weWon ? 'WIN' : 'LOSS'}
        </span>
      </div>

      <MatchProgressBar 
        homeDistance={ourTeam.totalDistance} 
        awayDistance={theirTeam.totalDistance}
        className="h-3 text-xs"
      />

      <div>
        <p className="flex items-center gap-1 text-xs font-medium">
          League Impact: 
          <span className={weWon ? 'text-green-600' : 'text-red-600'}>
            {getLeagueImpactText(match, clubId)}
          </span>
        </p>
      </div>

      <button
        className="w-full px-4 py-1 text-xs border rounded hover:bg-gray-50 transition-colors flex items-center justify-center gap-1"
        onClick={() => onExpandToggle(match.id)}
      >
        {expandedMatchId === match.id ? (
          <>
            <ChevronUp className="h-3 w-3" />
            Hide Match Details
          </>
        ) : (
          <>
            <ChevronDown className="h-3 w-3" />
            View Match Details
          </>
        )}
      </button>

      {expandedMatchId === match.id && (
        <MatchDetails
          homeTeam={ourTeam}
          awayTeam={theirTeam}
        />
      )}
    </div>
  );
};

export default MatchCard;
