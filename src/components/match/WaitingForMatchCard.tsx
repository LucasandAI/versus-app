
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Club } from '@/types';
import { getNextMatchStart } from '@/utils/date/matchTiming';
import CountdownTimer from './CountdownTimer';
import { formatLeague } from '@/utils/club/leagueUtils';
import UserAvatar from '@/components/shared/UserAvatar';
import { useNavigation } from '@/hooks/useNavigation';

interface WaitingForMatchCardProps {
  club: Club;
}

const WaitingForMatchCard: React.FC<WaitingForMatchCardProps> = ({ club }) => {
  const nextMatchStart = getNextMatchStart();
  const { navigateToClubDetail } = useNavigation();
  
  const handleClubClick = () => {
    navigateToClubDetail(club.id, club);
  };
  
  return (
    <Card className="mb-4 overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-center">
          <UserAvatar 
            name={club.name} 
            image={club.logo} 
            size="md"
            className="mr-3 cursor-pointer"
            onClick={handleClubClick}
          />
          <div>
            <h3 
              className="font-medium cursor-pointer hover:text-primary transition-colors"
              onClick={handleClubClick}
            >
              {club.name}
            </h3>
            <div className="flex items-center gap-1 mt-0.5">
              <span className="text-xs bg-gray-100 px-2 py-0.5 rounded text-gray-600">
                {formatLeague(club.division, club.tier)}
              </span>
              <span className="text-xs text-gray-500">
                • {club.members.length}/5 members
              </span>
            </div>
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
