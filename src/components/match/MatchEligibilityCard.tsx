
import React from 'react';
import { Club } from '@/types';
import { getMatchStatusMessage, getSecondsUntilNextMatch } from '@/utils/match/matchTimingUtils';
import CountdownTimer from './CountdownTimer';
import { Card } from '@/components/ui/card';
import { formatLeague, getDivisionEmoji } from '@/utils/club/leagueUtils';
import { Button } from '@/components/ui/button';
import { UserPlus } from 'lucide-react';

interface MatchEligibilityCardProps {
  club: Club;
  onInviteClick?: () => void;
  onClubClick?: () => void;
}

const MatchEligibilityCard: React.FC<MatchEligibilityCardProps> = ({ 
  club,
  onInviteClick,
  onClubClick
}) => {
  const { message, countdown, matchReady } = getMatchStatusMessage(club);

  return (
    <Card className="p-4 space-y-4">
      <div className="flex justify-between items-center">
        <div className="cursor-pointer" onClick={onClubClick}>
          <h3 className="font-semibold">{club.name}</h3>
          <div className="text-sm text-muted-foreground flex items-center gap-1">
            {getDivisionEmoji(club.division)} {formatLeague(club.division, club.tier)}
          </div>
        </div>
        
        {!matchReady && club.members.length < 5 && (
          <Button
            size="sm"
            variant="outline"
            onClick={(e) => {
              e.stopPropagation();
              if (onInviteClick) onInviteClick();
            }}
          >
            <UserPlus className="w-4 h-4 mr-1" />
            Invite
          </Button>
        )}
      </div>
      
      <div className="bg-muted rounded-md p-3 text-sm">
        <div className="font-medium">{message}</div>
        {countdown && (
          <div className="mt-1">
            <CountdownTimer
              secondsRemaining={getSecondsUntilNextMatch()}
              className="text-primary font-semibold"
            />
          </div>
        )}
        
        {!matchReady && club.members.length < 5 && (
          <div className="mt-2 flex items-center gap-1">
            <span className="text-xs text-muted-foreground">
              {club.members.length}/5 members
            </span>
            <div className="w-full bg-gray-200 rounded-full h-1.5">
              <div 
                className="bg-primary h-1.5 rounded-full" 
                style={{ width: `${Math.min(100, (club.members.length / 5) * 100)}%` }}
              ></div>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};

export default MatchEligibilityCard;
