
import React from 'react';
import { Club, Match } from '@/types';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Flame } from "lucide-react";

interface ClubStatsProps {
  club: Club;
  matchHistory: Match[];
}

const ClubStats: React.FC<ClubStatsProps> = ({ club, matchHistory }) => {
  // Calculate win record
  const calculateWinLoss = (matches: Match[]) => {
    let wins = 0;
    let losses = 0;
    
    matches.forEach(match => {
      const isHomeTeam = match.homeClub.id === club.id;
      const isWin = (isHomeTeam && match.winner === 'home') || (!isHomeTeam && match.winner === 'away');
      
      if (isWin) {
        wins++;
      } else {
        losses++;
      }
    });
    
    return { wins, losses };
  };
  
  // Calculate current win streak
  const calculateWinStreak = (matches: Match[]) => {
    let streak = 0;
    
    // Matches are already sorted from most recent to oldest
    for (const match of matches) {
      const isHomeTeam = match.homeClub.id === club.id;
      const isWin = (isHomeTeam && match.winner === 'home') || (!isHomeTeam && match.winner === 'away');
      
      if (isWin) {
        streak++;
      } else {
        break; // Stop counting after first loss
      }
    }
    
    return streak;
  };
  
  // Calculate total club distance
  const calculateTotalDistance = (matches: Match[]) => {
    let total = 0;
    
    matches.forEach(match => {
      const isHomeTeam = match.homeClub.id === club.id;
      const clubTeam = isHomeTeam ? match.homeClub : match.awayClub;
      total += clubTeam.totalDistance || 0;
    });
    
    return total.toFixed(1);
  };
  
  // Calculate average per member
  const calculateAveragePerMember = (totalDistance: string, memberCount: number) => {
    if (memberCount === 0) return '0';
    return (parseFloat(totalDistance) / memberCount).toFixed(1);
  };
  
  const { wins, losses } = calculateWinLoss(matchHistory);
  const winStreak = calculateWinStreak(matchHistory);
  const totalDistance = calculateTotalDistance(matchHistory);
  const memberCount = club.members.length || 1;
  const avgPerMember = calculateAveragePerMember(totalDistance, memberCount);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          Club Details
          {winStreak > 1 && (
            <span className="inline-flex items-center gap-1 bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full text-xs">
              <Flame className="h-3 w-3" />
              {winStreak} streak
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="bg-gray-50 p-3 rounded-md">
            <p className="text-xs text-gray-500">League</p>
            <p className="font-medium">{club.division} {club.tier}</p>
          </div>
          <div className="bg-gray-50 p-3 rounded-md">
            <p className="text-xs text-gray-500">Match Record</p>
            <p className="font-medium">
              {matchHistory.length > 0 
                ? `${wins}W - ${losses}L` 
                : 'No matches yet'}
            </p>
          </div>
          <div className="bg-gray-50 p-3 rounded-md">
            <p className="text-xs text-gray-500">Total Distance</p>
            <p className="font-medium">{matchHistory.length > 0 ? `${totalDistance} km` : '0 km'}</p>
          </div>
          <div className="bg-gray-50 p-3 rounded-md">
            <p className="text-xs text-gray-500">Avg. Per Member</p>
            <p className="font-medium">{matchHistory.length > 0 ? `${avgPerMember} km` : '0 km'}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ClubStats;
