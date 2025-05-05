
import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';
import { Club, Match, ClubMember } from '@/types';
import MatchProgressBar from '@/components/shared/MatchProgressBar';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import UserAvatar from '@/components/shared/UserAvatar';

interface CurrentMatchCardProps {
  club: Club;
  match: Match;
  onSelectUser: (userId: string, name: string, avatar?: string) => void;
}

const CurrentMatchCard: React.FC<CurrentMatchCardProps> = ({
  club,
  match,
  onSelectUser,
}) => {
  const [timeRemaining, setTimeRemaining] = useState<string>('');
  
  // Determine if our club is home or away
  const isHomeClub = match.homeClub.id === club.id;
  const ourClub = isHomeClub ? match.homeClub : match.awayClub;
  const opponentClub = isHomeClub ? match.awayClub : match.homeClub;
  
  // Setup match data
  const ourDistance = ourClub.totalDistance || 0;
  const opponentDistance = opponentClub.totalDistance || 0;
  
  // Calculate time remaining
  useEffect(() => {
    const calculateTimeRemaining = () => {
      const now = new Date();
      const endDate = new Date(match.endDate);
      const diffMs = endDate.getTime() - now.getTime();
      
      if (diffMs <= 0) {
        setTimeRemaining('Match ended');
        return;
      }
      
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      const diffSeconds = Math.floor((diffMs % (1000 * 60)) / 1000);
      
      setTimeRemaining(
        `${diffHours.toString().padStart(2, '0')}:${diffMinutes.toString().padStart(2, '0')}:${diffSeconds.toString().padStart(2, '0')}`
      );
    };
    
    calculateTimeRemaining();
    const timerId = setInterval(calculateTimeRemaining, 1000);
    
    return () => clearInterval(timerId);
  }, [match.endDate]);
  
  return (
    <Card className="overflow-hidden">
      <CardHeader className="p-4 bg-gray-50">
        <div className="flex justify-between items-center">
          <div className="flex flex-col">
            <h3 className="font-semibold">{ourClub.name}</h3>
            <p className="text-xs text-gray-500 capitalize">{club.division} {club.tier}</p>
          </div>
          <div className="text-center px-3 py-1 bg-gray-200 rounded-full flex items-center">
            <Clock className="h-3 w-3 mr-1" />
            <span className="text-xs font-medium">{timeRemaining}</span>
          </div>
          <div className="flex flex-col items-end">
            <h3 className="font-semibold">{opponentClub.name}</h3>
            <p className="text-xs text-gray-500 capitalize">
              {isHomeClub ? 'Away' : 'Home'} Team
            </p>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-4">
        <MatchProgressBar 
          homeDistance={isHomeClub ? ourDistance : opponentDistance}
          awayDistance={isHomeClub ? opponentDistance : ourDistance}
          className="mb-4"
        />
        
        <div className="grid grid-cols-2 gap-4">
          {/* Our club members */}
          <div>
            <h4 className="text-sm font-medium mb-2">Our Team</h4>
            <div className="space-y-2">
              {club.members.map((member) => (
                <div 
                  key={member.id} 
                  className="flex items-center justify-between text-sm"
                  onClick={() => onSelectUser(member.id, member.name, member.avatar)}
                >
                  <div className="flex items-center">
                    <UserAvatar 
                      name={member.name} 
                      image={member.avatar} 
                      size="xxs" 
                    />
                    <span className="ml-2">{member.name}</span>
                  </div>
                  <span>{member.distanceContribution?.toFixed(1) || '0.0'} km</span>
                </div>
              ))}
            </div>
          </div>
          
          {/* Opponent club members */}
          <div>
            <h4 className="text-sm font-medium mb-2">Opponent Team</h4>
            <div className="space-y-2">
              {opponentClub.members?.map((member) => (
                <div 
                  key={member.id} 
                  className="flex items-center justify-between text-sm"
                  onClick={() => onSelectUser(member.id, member.name, member.avatar)}
                >
                  <div className="flex items-center">
                    <UserAvatar 
                      name={member.name} 
                      image={member.avatar} 
                      size="xxs" 
                    />
                    <span className="ml-2">{member.name}</span>
                  </div>
                  <span>{member.distanceContribution?.toFixed(1) || '0.0'} km</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CurrentMatchCard;
