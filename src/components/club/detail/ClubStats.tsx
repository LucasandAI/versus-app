
import React from 'react';
import { Club, Match } from '@/types';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

interface ClubStatsProps {
  club: Club;
  matchHistory: Match[];
}

const ClubStats: React.FC<ClubStatsProps> = ({ club, matchHistory }) => {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Club Details</CardTitle>
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
                ? `${matchHistory.filter(m => m.winner === 'home').length}W - ${matchHistory.filter(m => m.winner === 'away').length}L` 
                : 'No matches yet'}
            </p>
          </div>
          <div className="bg-gray-50 p-3 rounded-md">
            <p className="text-xs text-gray-500">Total Distance</p>
            <p className="font-medium">{matchHistory.length > 0 ? '243.7 km' : '0 km'}</p>
          </div>
          <div className="bg-gray-50 p-3 rounded-md">
            <p className="text-xs text-gray-500">Avg. Per Member</p>
            <p className="font-medium">{matchHistory.length > 0 ? '81.2 km' : '0 km'}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ClubStats;
