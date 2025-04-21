import React, { useState } from 'react';
import { Match } from '@/types';
import MatchDetails from './MatchDetails';

// Update the MatchCardProps to include onSelectUser
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
  const isExpanded = expandedMatchId === match.id;

  return (
    <div className="border rounded-lg overflow-hidden">
      <div 
        className="flex justify-between items-center p-3 cursor-pointer hover:bg-gray-100 transition-colors"
        onClick={() => onExpandToggle(match.id)}
      >
        <div className="flex flex-col">
          <h4 className="text-sm font-semibold">
            {new Date(match.endDate).toLocaleDateString()}
          </h4>
          <p className="text-xs text-gray-500">
            {match.homeClub.name} vs {match.awayClub.name}
          </p>
        </div>
        <span className="text-gray-500">{isExpanded ? '▲' : '▼'}</span>
      </div>
      
      {expandedMatchId === match.id && (
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
