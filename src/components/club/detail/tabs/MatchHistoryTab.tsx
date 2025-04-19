
import React, { useState } from 'react';
import { Club } from '@/types';
import { Calendar, ChevronDown, ChevronUp } from "lucide-react";
import MatchProgressBar from '@/components/shared/MatchProgressBar';

interface MatchHistoryTabProps {
  club: Club;
}

const MatchHistoryTab: React.FC<MatchHistoryTabProps> = ({ club }) => {
  const [expandedMatchId, setExpandedMatchId] = useState<string | null>(null);
  const [showAllMatches, setShowAllMatches] = useState(false);

  const handleViewMatchDetails = (matchId: string) => {
    setExpandedMatchId(expandedMatchId === matchId ? null : matchId);
  };

  const handleViewAllHistory = () => {
    setShowAllMatches(!showAllMatches);
  };

  // Helper function to get correct promotion/relegation text based on division and result
  const getLeagueImpactText = (division: string, tier: number | undefined, isWin: boolean) => {
    // Default to tier 1 if undefined
    const currentTier = tier || 1;
    
    if (isWin) {
      // Promotion logic
      if (division === 'Bronze') {
        return 'Promoted to Silver ' + currentTier;
      } else if (division === 'Silver') {
        return 'Promoted to Gold ' + currentTier;
      } else if (division === 'Gold') {
        return 'Promoted to Platinum ' + currentTier;
      } else if (division === 'Platinum') {
        return 'Promoted to Diamond ' + currentTier;
      } else if (division === 'Diamond') {
        return 'Promoted to Elite';
      } else {
        return 'Maintained Elite status';
      }
    } else {
      // Relegation logic
      if (division === 'Elite') {
        return 'Relegated to Diamond 1';
      } else if (division === 'Diamond') {
        return 'Relegated to Platinum ' + currentTier;
      } else if (division === 'Platinum') {
        return 'Relegated to Gold ' + currentTier;
      } else if (division === 'Gold') {
        return 'Relegated to Silver ' + currentTier;
      } else if (division === 'Silver') {
        return 'Relegated to Bronze ' + currentTier;
      } else {
        return 'Remained in Bronze ' + currentTier;
      }
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-3 sm:p-4">
      <div className="flex items-center gap-2 mb-3">
        <Calendar className="text-primary h-4 w-4" />
        <h2 className="text-lg font-semibold">Match History</h2>
      </div>

      {club.matchHistory && club.matchHistory.length > 0 ? (
        <div className="space-y-4">
          {/* Show maximum of 2 matches by default unless showAllMatches is true */}
          {club.matchHistory.slice(0, showAllMatches ? undefined : 2).map((match) => {
            const isHomeTeam = match.homeClub.id === club.id;
            const ourTeam = isHomeTeam ? match.homeClub : match.awayClub;
            const theirTeam = isHomeTeam ? match.awayClub : match.homeClub;
            const weWon = (isHomeTeam && match.winner === 'home') || (!isHomeTeam && match.winner === 'away');
            
            // Calculate total distances
            const ourDistance = ourTeam.members.reduce((sum, m) => sum + (m.distanceContribution || 0), 0);
            const theirDistance = theirTeam.members.reduce((sum, m) => sum + (m.distanceContribution || 0), 0);
            
            const matchDate = new Date(match.startDate);
            const endDate = new Date(match.endDate);
            const dateRange = `${matchDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}–${endDate.getDate()}, ${endDate.getFullYear()}`;

            return (
              <div key={match.id} className="space-y-2 pb-3 border-b border-gray-100 last:border-0">
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
                  homeDistance={ourDistance} 
                  awayDistance={theirDistance}
                  className="h-3 text-xs"
                />

                <div>
                  <p className="flex items-center gap-1 text-xs font-medium">
                    League Impact: 
                    <span className={weWon ? 'text-green-600' : 'text-red-600'}>
                      {getLeagueImpactText(club.division, club.tier, weWon)}
                    </span>
                  </p>
                </div>

                <button
                  className="w-full px-4 py-1 text-xs border rounded hover:bg-gray-50 transition-colors flex items-center justify-center gap-1"
                  onClick={() => handleViewMatchDetails(match.id)}
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
                  <div className="mt-3 bg-gray-50 p-3 rounded-md space-y-3">
                    <div>
                      <h4 className="text-xs font-semibold mb-2">{ourTeam.name} Members</h4>
                      <div className="space-y-1">
                        {ourTeam.members.map((member) => (
                          <div key={member.id} className="flex justify-between text-xs">
                            <span>{member.name}</span>
                            <span className="font-medium">{member.distanceContribution?.toFixed(1)} km</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="text-xs font-semibold mb-2">{theirTeam.name} Members</h4>
                      <div className="space-y-1">
                        {theirTeam.members.map((member) => (
                          <div key={member.id} className="flex justify-between text-xs">
                            <span>{member.name}</span>
                            <span className="font-medium">{member.distanceContribution?.toFixed(1)} km</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {club.matchHistory.length > 2 && (
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
                  View All Match History ({club.matchHistory.length - 2} more)
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
