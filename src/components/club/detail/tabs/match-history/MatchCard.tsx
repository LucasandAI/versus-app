
import React from 'react';
import { Match } from '@/types';
import MatchDetails from './MatchDetails';
import { useApp } from '@/context/AppContext';

interface MatchCardProps {
  match: Match;
  clubId: string;
  expandedMatchId: string | null;
  onExpandToggle: (matchId: string) => void;
  onSelectUser?: (userId: string, name: string, avatar?: string) => void;
}

const MatchCard: React.FC<MatchCardProps> = ({ 
  match, 
  clubId, 
  expandedMatchId,
  onExpandToggle,
  onSelectUser
}) => {
  const { setSelectedClub, setCurrentView } = useApp();
  const isExpanded = expandedMatchId === match.id;

  // Determine if the user's club won
  const userClubIsHome = clubId === match.homeClub.id;
  const homeClubWon = match.winner === 'home';
  const awayClubWon = match.winner === 'away';
  const userClubWon = (userClubIsHome && homeClubWon) || (!userClubIsHome && awayClubWon);

  const handleClubClick = (clubData: Match['homeClub'] | Match['awayClub'], e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedClub({
      id: clubData.id,
      name: clubData.name,
      logo: clubData.logo || '/placeholder.svg',
      division: 'Gold',
      tier: 3,
      members: clubData.members,
      matchHistory: []
    });
    setCurrentView('clubDetail');
  };

  return (
    <div className="border rounded-lg overflow-hidden">
      <div 
        className="flex justify-between items-center p-3 cursor-pointer hover:bg-gray-100 transition-colors"
        onClick={() => onExpandToggle(match.id)}
      >
        <div className="flex-1">
          <h4 className="text-sm font-semibold">
            {new Date(match.endDate).toLocaleDateString()}
          </h4>
          <p className="text-xs text-gray-500 flex items-center gap-2">
            <span 
              className="hover:text-primary cursor-pointer"
              onClick={(e) => handleClubClick(match.homeClub, e)}
            >
              {match.homeClub.name}
            </span>
            <span>vs</span>
            <span 
              className="hover:text-primary cursor-pointer"
              onClick={(e) => handleClubClick(match.awayClub, e)}
            >
              {match.awayClub.name}
            </span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          {match.winner && (
            <span className={`text-xs px-2 py-0.5 rounded-full ${
              userClubWon 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              {userClubWon ? 'WIN' : 'LOSS'}
            </span>
          )}
          <span className="text-gray-500">{isExpanded ? '▲' : '▼'}</span>
        </div>
      </div>
      
      {isExpanded && (
        <MatchDetails 
          match={match} 
          clubId={clubId}
          onSelectUser={onSelectUser}
        />
      )}
    </div>
  );
};

export default MatchCard;
