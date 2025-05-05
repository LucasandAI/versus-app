
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Club } from '@/types';
import { getNextMatchStart } from '@/utils/date/matchTiming';
import CountdownTimer from './CountdownTimer';
import { formatLeague } from '@/utils/club/leagueUtils';
import UserAvatar from '@/components/shared/UserAvatar';

interface WaitingForMatchCardProps {
  club: Club;
}

const WaitingForMatchCard: React.FC<WaitingForMatchCardProps> = ({ club }) => {
  const nextMatchStart = getNextMatchStart();
  
  return (
    <Card className="mb-4 overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-center">
          <UserAvatar 
            name={club.name} 
            image={club.logo} 
            size="md"
            className="mr-3"
          />
          <div>
            <h3 className="font-medium">{club.name}</h3>
            <span className="text-sm text-gray-600">
              {formatLeague(club.division, club.tier)}
            </span>
          </div>
        </div>
        
        <div className="mt-4 p-3 bg-amber-50 rounded-md">
          <p className="text-sm mb-1">Matchmaking will begin soon. Your next match starts Monday at 00:00.</p>
          <div className="flex items-center">
            <span className="text-xs text-gray-500 mr-2">Countdown:</span>
            <CountdownTimer 
              targetDate={nextMatchStart} 
              className="text-sm font-medium text-amber-700"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default WaitingForMatchCard;
