import React, { useState } from 'react';
import { Club } from '@/types';
import { Calendar, ChevronDown, ChevronUp } from "lucide-react";
import MatchCard from './match-history/MatchCard';
import { useApp } from '@/context/AppContext';
import { useClubNavigation } from '@/hooks/useClubNavigation';

interface MatchHistoryTabProps {
  club: Club;
}

const MatchHistoryTab: React.FC<MatchHistoryTabProps> = ({ club }) => {
  const [expandedMatchId, setExpandedMatchId] = useState<string | null>(null);
  const [showAllMatches, setShowAllMatches] = useState(false);
  const { setSelectedUser, setCurrentView } = useApp();
  const { navigateToClub } = useClubNavigation();

  const handleViewMatchDetails = (matchId: string) => {
    setExpandedMatchId(expandedMatchId === matchId ? null : matchId);
  };

  const handleViewAllHistory = () => {
    setShowAllMatches(!showAllMatches);
  };

  const handleSelectUser = (userId: string, name: string, avatar?: string) => {
    setSelectedUser({
      id: userId,
      name: name,
      avatar: avatar || '/placeholder.svg',
      stravaConnected: true,
      clubs: []
    });
    setCurrentView('profile');
  };

  const handleSelectClub = (clubId: string, name: string) => {
    navigateToClub({ id: clubId, name });
  };

  const matchHistory = club.matchHistory 
    ? [...club.matchHistory].sort((a, b) => 
        new Date(b.endDate).getTime() - new Date(a.endDate).getTime())
    : [];

  const displayedMatches = showAllMatches 
    ? matchHistory 
    : matchHistory.slice(0, 3);

  return (
    <div className="bg-white rounded-lg shadow p-3 sm:p-4">
      <div className="flex items-center gap-2 mb-3">
        <Calendar className="text-primary h-4 w-4" />
        <h2 className="text-lg font-semibold">Match History</h2>
      </div>

      {matchHistory.length > 0 ? (
        <div className="space-y-4">
          {displayedMatches.map((match) => (
            <MatchCard
              key={match.id}
              match={match}
              clubId={club.id}
              expandedMatchId={expandedMatchId}
              onExpandToggle={handleViewMatchDetails}
              onSelectUser={handleSelectUser}
              onSelectClub={handleSelectClub}
            />
          ))}

          {matchHistory.length > 3 && (
            <button
              className="w-full text-primary hover:text-primary/80 text-xs py-1 flex items-center justify-center gap-1"
              onClick={handleViewAllHistory}
            >
              {showAllMatches ? (
                <>
                  <ChevronUp className="h-3 w-3" />
                  Show Less Match History
                </>
              ) : (
                <>
                  <ChevronDown className="h-3 w-3" />
                  View All Match History ({matchHistory.length - 3} more)
                </>
              )}
            </button>
          )}
        </div>
      ) : (
        <div className="text-center py-4">
          <p className="text-gray-500 text-sm">No match history yet.</p>
          <p className="text-xs text-gray-400">Completed matches will appear here.</p>
        </div>
      )}
    </div>
  );
};

export default MatchHistoryTab;
