
import React, { useState, useEffect } from 'react';
import { Clock, ChevronDown, ChevronUp } from 'lucide-react';
import { Club, Match, ClubMember } from '@/types';
import MatchProgressBar from '@/components/shared/MatchProgressBar';
import { Card, CardContent } from '@/components/ui/card';
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
  const [showDetails, setShowDetails] = useState(false);
  
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
      
      // Calculate days remaining
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      
      if (diffDays > 0) {
        setTimeRemaining(`${diffDays} days left`);
      } else {
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
        
        setTimeRemaining(
          `${diffHours.toString().padStart(2, '0')}:${diffMinutes.toString().padStart(2, '0')} left`
        );
      }
    };
    
    calculateTimeRemaining();
    const timerId = setInterval(calculateTimeRemaining, 1000);
    
    return () => clearInterval(timerId);
  }, [match.endDate]);
  
  const toggleDetails = () => {
    setShowDetails(!showDetails);
  };
  
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        <div className="p-4">
          <div className="flex items-center gap-3 mb-3">
            <UserAvatar 
              name={club.name} 
              image={club.logo} 
              size="sm"
            />
            <div>
              <h3 className="font-semibold">{club.name}</h3>
              <p className="text-xs text-gray-500 capitalize">{club.division} {club.tier}</p>
            </div>
          </div>
          
          <div className="border-t border-b py-3">
            <div className="flex justify-between mb-1">
              <h4 className="font-semibold">Current Match</h4>
              <div className="text-center px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-xs font-medium">
                {timeRemaining}
              </div>
            </div>
            
            <div className="flex justify-between items-center my-3">
              <h5 className="font-medium">{ourClub.name}</h5>
              <span className="text-sm text-gray-500">vs</span>
              <h5 className="font-medium text-right">{opponentClub.name}</h5>
            </div>
            
            <MatchProgressBar 
              homeDistance={isHomeClub ? ourDistance : opponentDistance}
              awayDistance={isHomeClub ? opponentDistance : ourDistance}
              className="mb-2"
            />
            
            <button 
              onClick={toggleDetails}
              className="flex items-center justify-center w-full text-primary mt-2 py-1"
            >
              {showDetails ? (
                <>
                  <span className="mr-1">Hide Details</span>
                  <ChevronUp className="h-4 w-4" />
                </>
              ) : (
                <>
                  <span className="mr-1">View Details</span>
                  <ChevronDown className="h-4 w-4" />
                </>
              )}
            </button>
          </div>
          
          {showDetails && (
            <div className="mt-3">
              <div className="grid grid-cols-2 gap-4">
                {/* Our club members */}
                <div>
                  <h4 className="text-sm font-medium mb-2">Home Club Members</h4>
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
                  <h4 className="text-sm font-medium mb-2">Away Club Members</h4>
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
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default CurrentMatchCard;
