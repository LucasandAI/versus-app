
import React from 'react';
import { Club, Match } from '@/types';
import { formatCountdown, getSecondsUntilMatchEnd } from '@/utils/match/matchTimingUtils';
import { formatLeague, getDivisionEmoji } from '@/utils/club/leagueUtils';
import CountdownTimer from './CountdownTimer';
import { calculateTotalClubDistance } from '@/utils/club/memberDistanceUtils';
import { Progress } from '@/components/ui/progress';
import { Card } from '@/components/ui/card';

interface CurrentMatchCardProps {
  club: Club;
  match?: Match;
  onClick?: () => void;
}

const CurrentMatchCard: React.FC<CurrentMatchCardProps> = ({ club, match, onClick }) => {
  const isUserClub = match && (match.homeClub.id === club.id);
  const userClub = isUserClub ? match?.homeClub : match?.awayClub;
  const opponentClub = isUserClub ? match?.awayClub : match?.homeClub;
  
  // Calculate current scores
  const userDistance = calculateTotalClubDistance(club);
  const opponentDistance = match ? (isUserClub ? match.awayClub.totalDistance : match.homeClub.totalDistance) : 0;
  
  // If we don't have a match, show a placeholder
  if (!match) {
    return (
      <Card className="p-4 space-y-3">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="font-semibold">{club.name}</h3>
            <div className="text-sm text-muted-foreground flex items-center gap-1">
              {getDivisionEmoji(club.division)} {formatLeague(club.division, club.tier)}
            </div>
          </div>
          <div className="text-sm text-muted-foreground">
            Waiting for match
          </div>
        </div>
      </Card>
    );
  }
  
  return (
    <Card className="p-4 space-y-3 cursor-pointer hover:shadow-md transition-shadow" onClick={onClick}>
      <div className="flex justify-between items-center">
        <div>
          <h3 className="font-semibold">{club.name}</h3>
          <div className="text-sm text-muted-foreground flex items-center gap-1">
            {getDivisionEmoji(club.division)} {formatLeague(club.division, club.tier)}
          </div>
        </div>
        <div className="text-sm text-muted-foreground">
          <div className="text-right">Match ends in:</div>
          <CountdownTimer 
            secondsRemaining={getSecondsUntilMatchEnd()} 
            className="text-right font-semibold"
          />
        </div>
      </div>
      
      {/* Score display */}
      <div className="grid grid-cols-3 gap-2 items-center">
        <div className="text-center font-semibold text-lg">{userDistance.toFixed(1)} km</div>
        <div className="text-center text-xs text-muted-foreground">vs</div>
        <div className="text-center font-semibold text-lg">{opponentDistance.toFixed(1)} km</div>
      </div>
      
      {/* Progress bar */}
      <div className="w-full">
        <Progress 
          value={Math.min(100, userDistance / (userDistance + opponentDistance) * 100 || 50)} 
          className="h-2" 
        />
      </div>
      
      {/* Opponent info */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full overflow-hidden">
            {opponentClub && <img src={opponentClub.logo} alt="Opponent club" className="w-full h-full object-cover" />}
          </div>
          <div>
            <div className="text-sm font-medium">{opponentClub?.name || "Unknown club"}</div>
            {opponentClub && (
              <div className="text-xs text-muted-foreground flex items-center gap-1">
                {getDivisionEmoji(opponentClub?.division)} {formatLeague(opponentClub?.division, opponentClub?.tier)}
              </div>
            )}
          </div>
        </div>
        <div className="font-semibold text-sm">
          {opponentDistance.toFixed(1)} km
        </div>
      </div>
      
      {/* Member contributions */}
      <div className="space-y-1 mt-2">
        <h4 className="text-xs font-medium text-muted-foreground">Team Contributions</h4>
        <div className="space-y-1">
          {club.members.map(member => (
            <div key={member.id} className="flex justify-between items-center text-sm">
              <div className="flex items-center gap-1">
                <div className="w-4 h-4 rounded-full overflow-hidden">
                  <img src={member.avatar} alt={member.name} className="w-full h-full object-cover" />
                </div>
                <span>{member.name}</span>
              </div>
              <span className="font-mono">{member.distanceContribution.toFixed(1)} km</span>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
};

export default CurrentMatchCard;
