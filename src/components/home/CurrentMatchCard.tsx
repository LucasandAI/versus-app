
import React, { useState } from 'react';
import { Club, Match } from '@/types';
import { Card } from '../ui/card';
import UserAvatar from '../shared/UserAvatar';
import { ChevronDown, Clock } from 'lucide-react';
import { formatLeague } from '@/utils/club/leagueUtils';
import MatchProgressBar from '../shared/MatchProgressBar';
import { cn } from '@/lib/utils';

interface CurrentMatchCardProps {
  club: Club;
  onSelectUser: (userId: string, name: string, avatar?: string) => void;
  onSelectClub: (club: Club) => void;
  timeUntilNextCycle: number;
  formatCountdown: (timeInMs: number) => string;
}

const CurrentMatchCard: React.FC<CurrentMatchCardProps> = ({ 
  club, 
  onSelectUser,
  onSelectClub,
  timeUntilNextCycle,
  formatCountdown
}) => {
  const [showDetails, setShowDetails] = useState(false);
  const hasEnoughMembers = club.members.length >= 5;
  const hasActiveMatch = club.currentMatch && club.currentMatch.status === 'active';
  
  const handleClubClick = () => {
    onSelectClub(club);
  };

  if (!hasEnoughMembers) {
    return (
      <Card className="p-4 overflow-hidden">
        <div className="flex items-center space-x-3 mb-4 cursor-pointer" onClick={handleClubClick}>
          <UserAvatar 
            name={club.name} 
            image={club.logo} 
            size="md" 
          />
          <div>
            <h3 className="font-semibold text-lg">{club.name}</h3>
            <p className="text-sm text-gray-600">{formatLeague(club.division, club.tier)} • {club.members.length} members</p>
          </div>
        </div>
        
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 text-center">
          <p className="text-yellow-800 font-medium">
            Your club needs 5 members to start competing in the league.
          </p>
        </div>
      </Card>
    );
  }
  
  if (!hasActiveMatch) {
    return (
      <Card className="p-4 overflow-hidden">
        <div className="flex items-center space-x-3 mb-4 cursor-pointer" onClick={handleClubClick}>
          <UserAvatar 
            name={club.name} 
            image={club.logo} 
            size="md" 
          />
          <div>
            <h3 className="font-semibold text-lg">{club.name}</h3>
            <p className="text-sm text-gray-600">{formatLeague(club.division, club.tier)} • {club.members.length} members</p>
          </div>
        </div>
        
        <div className="bg-blue-50 border border-blue-100 rounded-md p-4 text-center">
          <p className="text-blue-800 font-medium mb-2">
            Your club is ready. A new opponent will be found in the next match cycle.
          </p>
          <div className="flex items-center justify-center text-blue-700">
            <Clock className="h-4 w-4 mr-1" />
            <span className="text-sm font-medium">{formatCountdown(timeUntilNextCycle)}</span>
          </div>
        </div>
      </Card>
    );
  }

  // Active match case
  const match = club.currentMatch;
  const isHomeTeam = match.homeClub.id === club.id;
  const myTeam = isHomeTeam ? match.homeClub : match.awayClub;
  const opponentTeam = isHomeTeam ? match.awayClub : match.homeClub;
  
  // Calculate time until match ends
  const endDate = new Date(match.endDate);
  const now = new Date();
  const timeUntilEnd = Math.max(0, endDate.getTime() - now.getTime());
  
  // Calculate total distances
  const myDistance = myTeam.totalDistance;
  const opponentDistance = opponentTeam.totalDistance;
  
  // Sort members by distance contribution (highest first)
  const sortedMyMembers = [...myTeam.members].sort(
    (a, b) => (b.distanceContribution || 0) - (a.distanceContribution || 0)
  );
  
  const sortedOpponentMembers = [...opponentTeam.members].sort(
    (a, b) => (b.distanceContribution || 0) - (a.distanceContribution || 0)
  );

  return (
    <Card className="overflow-hidden">
      <div className="p-4">
        <div className="flex items-center space-x-3 mb-4 cursor-pointer" onClick={handleClubClick}>
          <UserAvatar 
            name={club.name} 
            image={club.logo} 
            size="md" 
          />
          <div>
            <h3 className="font-semibold text-lg">{club.name}</h3>
            <p className="text-sm text-gray-600">{formatLeague(club.division, club.tier)} • {club.members.length} members</p>
          </div>
        </div>

        <div>
          <div className="flex justify-between items-center mb-3">
            <div className="flex-1 text-left">
              <h4 className="font-medium">{myTeam.name}</h4>
              <p className="text-sm text-gray-600">{formatLeague(club.division, club.tier)}</p>
            </div>
            
            <div className="text-center px-2">
              <div className="bg-blue-100 text-blue-800 text-xs rounded-full px-2 py-1">
                <Clock className="inline-block h-3 w-3 mr-1" />
                {formatCountdown(timeUntilEnd)}
              </div>
              <p className="text-xs mt-1">vs</p>
            </div>
            
            <div className="flex-1 text-right">
              <h4 className="font-medium">{opponentTeam.name}</h4>
              <p className="text-sm text-gray-600">{formatLeague(club.division, club.tier)}</p>
            </div>
          </div>
          
          <MatchProgressBar
            homeDistance={myDistance}
            awayDistance={opponentDistance}
            className="mb-2"
          />
          
          <button
            className="flex items-center justify-center gap-1 text-sm w-full text-gray-500 hover:text-gray-700 mt-2"
            onClick={() => setShowDetails(!showDetails)}
          >
            {showDetails ? 'Hide Details' : 'Show Details'}
            <ChevronDown className={cn("h-4 w-4 transition-transform", showDetails ? "rotate-180" : "")} />
          </button>
        </div>
      </div>
      
      {showDetails && (
        <div className="bg-gray-50 p-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h5 className="text-sm font-medium mb-2">{isHomeTeam ? 'Home' : 'Away'} Club Members</h5>
              <div className="space-y-2">
                {sortedMyMembers.map(member => (
                  <div 
                    key={member.id} 
                    className="flex items-center justify-between hover:bg-gray-100 p-1 rounded cursor-pointer"
                    onClick={() => onSelectUser(member.id, member.name, member.avatar)}
                  >
                    <div className="flex items-center">
                      <UserAvatar name={member.name} image={member.avatar} size="xs" className="mr-2" />
                      <span className="text-sm">{member.name}</span>
                    </div>
                    <span className="text-sm font-medium">{member.distanceContribution?.toFixed(1) || 0} km</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div>
              <h5 className="text-sm font-medium mb-2">{isHomeTeam ? 'Away' : 'Home'} Club Members</h5>
              <div className="space-y-2">
                {sortedOpponentMembers.map(member => (
                  <div 
                    key={member.id} 
                    className="flex items-center justify-between hover:bg-gray-100 p-1 rounded cursor-pointer"
                    onClick={() => onSelectUser(member.id, member.name, member.avatar)}
                  >
                    <div className="flex items-center">
                      <UserAvatar name={member.name} image={member.avatar} size="xs" className="mr-2" />
                      <span className="text-sm">{member.name}</span>
                    </div>
                    <span className="text-sm font-medium">{member.distanceContribution?.toFixed(1) || 0} km</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
};

export default CurrentMatchCard;
