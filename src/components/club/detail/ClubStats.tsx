
import React from 'react';
import { Club, Match } from '@/types';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { formatLeague } from '@/utils/club/leagueUtils';
import { Flame } from "lucide-react";

interface ClubStatsProps {
  club: Club;
  matchHistory: Match[];
}

const ClubStats: React.FC<ClubStatsProps> = ({ club, matchHistory }) => {
  // Safely handle potentially undefined matchHistory
  const safeMatchHistory = matchHistory || [];
  
  // Calculate win/loss record from match history
  const wins = safeMatchHistory.filter(match => {
    const isHomeTeam = match.homeClub.id === club.id;
    return (isHomeTeam && match.winner === 'home') || (!isHomeTeam && match.winner === 'away');
  }).length;
  
  const losses = safeMatchHistory.length - wins;
  
  // Calculate win streak
  const winStreak = calculateWinStreak(safeMatchHistory, club.id);
  
  // Calculate total and average distance
  const totalDistance = safeMatchHistory.reduce((sum, match) => {
    const isHomeTeam = match.homeClub.id === club.id;
    const clubInMatch = isHomeTeam ? match.homeClub : match.awayClub;
    return sum + clubInMatch.totalDistance;
  }, 0);
  
  // Safely handle potentially undefined club.members
  const memberCount = Array.isArray(club.members) ? club.members.length : 0;
  const avgPerMember = memberCount > 0 ? (totalDistance / memberCount) : 0;
  
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          Club Details
          {winStreak > 1 && (
            <div className="flex items-center gap-1 text-sm font-normal bg-amber-100 text-amber-800 px-2 py-0.5 rounded">
              <Flame className="h-3.5 w-3.5 text-amber-600" />
              <span>{winStreak} streak</span>
            </div>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="bg-gray-50 p-3 rounded-md">
            <p className="text-xs text-gray-500">League</p>
            <p className="font-medium">{formatLeague(club.division, club.tier)}</p>
          </div>
          <div className="bg-gray-50 p-3 rounded-md">
            <p className="text-xs text-gray-500">Match Record</p>
            <p className="font-medium">
              {safeMatchHistory.length > 0 
                ? `${wins}W - ${losses}L` 
                : 'No matches yet'}
            </p>
          </div>
          <div className="bg-gray-50 p-3 rounded-md">
            <p className="text-xs text-gray-500">Total Distance</p>
            <p className="font-medium">{totalDistance > 0 ? `${totalDistance.toFixed(1)} km` : '0 km'}</p>
          </div>
          <div className="bg-gray-50 p-3 rounded-md">
            <p className="text-xs text-gray-500">Avg. Per Member</p>
            <p className="font-medium">{avgPerMember > 0 ? `${avgPerMember.toFixed(1)} km` : '0 km'}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Helper function to calculate win streak
const calculateWinStreak = (matches: Match[], clubId: string): number => {
  if (!matches.length) return 0;
  
  // Sort by most recent first
  const sortedMatches = [...matches].sort((a, b) => 
    new Date(b.endDate).getTime() - new Date(a.endDate).getTime()
  );
  
  let streak = 0;
  
  for (const match of sortedMatches) {
    const isHomeTeam = match.homeClub.id === clubId;
    const isWin = (isHomeTeam && match.winner === 'home') || (!isHomeTeam && match.winner === 'away');
    
    if (isWin) {
      streak++;
    } else {
      break; // Stop counting on first loss
    }
  }
  
  return streak;
};

export default ClubStats;
