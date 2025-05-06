
import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Match, Club, ClubMember } from '@/types';
import { ChevronDown, Clock } from 'lucide-react';
import MatchProgressBar from '@/components/shared/MatchProgressBar';
import { Button } from '@/components/ui/button';
import { useNavigation } from '@/hooks/useNavigation';
import { supabase } from '@/integrations/supabase/client';
import UserAvatar from '@/components/shared/UserAvatar';
import { formatLeague } from '@/utils/club/leagueUtils';

interface CurrentMatchCardProps {
  match: Match;
  userClub: Club;
  onViewProfile: (userId: string, name: string, avatar?: string) => void;
}

const CurrentMatchCard: React.FC<CurrentMatchCardProps> = ({ 
  match: initialMatch, 
  userClub: initialUserClub, 
  onViewProfile 
}) => {
  const [showMemberContributions, setShowMemberContributions] = useState(false);
  const [match, setMatch] = useState(initialMatch);
  const [userClub, setUserClub] = useState(initialUserClub);
  const matchEndDateRef = useRef<Date>(new Date(initialMatch.endDate));
  const [timeRemaining, setTimeRemaining] = useState<string>('');
  
  const { navigateToClubDetail } = useNavigation();
  
  // Determine if user club is home or away
  const isHome = match.homeClub.id === userClub.id;
  const userClubMatch = isHome ? match.homeClub : match.awayClub;
  const opponentClubMatch = isHome ? match.awayClub : match.homeClub;
  
  // Calculate time remaining for the match
  useEffect(() => {
    const calculateTimeRemaining = () => {
      const now = new Date();
      const endDate = new Date(match.endDate);
      const timeDiff = endDate.getTime() - now.getTime();
      
      if (timeDiff <= 0) {
        return '00:00:00';
      }
      
      const hours = Math.floor(timeDiff / (1000 * 60 * 60));
      const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((timeDiff % (1000 * 60)) / 1000);
      
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    };
    
    setTimeRemaining(calculateTimeRemaining());
    
    const timer = setInterval(() => {
      const remaining = calculateTimeRemaining();
      setTimeRemaining(remaining);
      
      if (remaining === '00:00:00') {
        clearInterval(timer);
        window.dispatchEvent(new CustomEvent('matchEnded', { 
          detail: { matchId: match.id } 
        }));
      }
    }, 1000);
    
    return () => clearInterval(timer);
  }, [match.endDate, match.id]);
  
  // Handle real-time updates for match data
  useEffect(() => {
    // Update state when props change
    setMatch(initialMatch);
    setUserClub(initialUserClub);
    
    // Update match end date reference when match data changes
    const endDate = new Date(initialMatch.endDate);
    if (endDate.getTime() !== matchEndDateRef.current.getTime()) {
      matchEndDateRef.current = endDate;
    }

    // Subscribe to match distance contributions
    const distanceChannel = supabase
      .channel(`match-distances-${initialMatch.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'match_distances',
          filter: `match_id=eq.${initialMatch.id}`
        },
        (payload) => {
          console.log(`[CurrentMatchCard] Match distance updated for ${initialMatch.id}:`, payload);
          window.dispatchEvent(new CustomEvent('matchDistanceUpdated', { 
            detail: { matchId: initialMatch.id } 
          }));
        }
      )
      .subscribe();

    // Listen for match data updates
    const handleMatchUpdate = (event: CustomEvent) => {
      if (event.detail?.matchId === initialMatch.id || event.detail?.clubId === initialUserClub.id) {
        console.log('[CurrentMatchCard] Match updated, refreshing data');
        setMatch(initialMatch);
        setUserClub(initialUserClub);
      }
    };

    window.addEventListener('matchDistanceUpdated', handleMatchUpdate as EventListener);
    window.addEventListener('matchUpdated', handleMatchUpdate as EventListener);
    window.addEventListener('userDataUpdated', () => {
      setMatch(initialMatch);
      setUserClub(initialUserClub);
    });

    return () => {
      supabase.removeChannel(distanceChannel);
      window.removeEventListener('matchDistanceUpdated', handleMatchUpdate as EventListener);
      window.removeEventListener('matchUpdated', handleMatchUpdate as EventListener);
      window.removeEventListener('userDataUpdated', () => {
        setMatch(initialMatch);
        setUserClub(initialUserClub);
      });
    };
  }, [initialMatch, initialUserClub]);

  const handleMemberClick = (member: ClubMember) => {
    onViewProfile(member.id, member.name, member.avatar);
  };

  const handleClubClick = (clubId: string, clubData: any) => {
    navigateToClubDetail(clubId, clubData);
  };
  
  return (
    <Card className="mb-4 overflow-hidden border-0 shadow-md">
      <CardContent className="p-4">
        {/* Match Content */}
        <div className="mb-4">
          {/* Match in Progress Notification */}
          <div className="bg-amber-50 p-3 rounded-md mb-4">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold">Match in progress</h3>
              <div className="flex items-center text-amber-800 text-sm">
                <Clock className="h-4 w-4 mr-1" />
                <span>Time remaining: </span>
                <span className="font-mono ml-1">{timeRemaining}</span>
              </div>
            </div>
          </div>
              
          {/* Clubs Matchup */}
          <div className="flex justify-between items-center mb-6">
            {/* User Club (always on left) */}
            <div className="text-center">
              <div 
                className="flex flex-col items-center cursor-pointer"
                onClick={() => handleClubClick(userClubMatch.id, userClubMatch)}
              >
                <UserAvatar 
                  name={userClubMatch.name}
                  image={userClubMatch.logo} 
                  size="md"
                  className="mb-2"
                />
                <h4 className="font-medium text-sm hover:text-primary transition-colors">
                  {userClubMatch.name}
                </h4>
                <span className="text-xs bg-gray-100 px-2 py-0.5 rounded-full text-gray-600 mt-1">
                  {formatLeague(userClubMatch.division, userClubMatch.tier)}
                </span>
              </div>
            </div>
                
            <div className="text-center text-gray-500 font-medium">vs</div>
                
            {/* Opponent Club (always on right) */}
            <div className="text-center">
              <div 
                className="flex flex-col items-center cursor-pointer"
                onClick={() => handleClubClick(opponentClubMatch.id, opponentClubMatch)}
              >
                <UserAvatar 
                  name={opponentClubMatch.name}
                  image={opponentClubMatch.logo} 
                  size="md"
                  className="mb-2"
                />
                <h4 className="font-medium text-sm hover:text-primary transition-colors">
                  {opponentClubMatch.name}
                </h4>
                <span className="text-xs bg-gray-100 px-2 py-0.5 rounded-full text-gray-600 mt-1">
                  {formatLeague(opponentClubMatch.division, opponentClubMatch.tier)}
                </span>
              </div>
            </div>
          </div>
              
          {/* Match Progress Bar */}
          <MatchProgressBar
            homeDistance={userClubMatch.totalDistance}
            awayDistance={opponentClubMatch.totalDistance}
            className="h-5"
          />
              
          {/* Member Contributions Toggle Button */}
          <Button 
            variant="outline"
            size="sm"
            className="w-full mt-4 text-sm flex items-center justify-center bg-gray-50 hover:bg-gray-100 border-gray-200"
            onClick={() => setShowMemberContributions(!showMemberContributions)}
          >
            {showMemberContributions ? 'Hide Member Contributions' : 'Show Member Contributions'} 
            <ChevronDown className={`ml-1 h-4 w-4 transition-transform ${showMemberContributions ? 'rotate-180' : ''}`} />
          </Button>
        </div>
        
        {/* Member Contributions Panel - Only shown when toggled */}
        {showMemberContributions && (
          <div className="border-t border-gray-100 pt-4 mt-2">
            <div className="grid grid-cols-2 gap-4">
              {/* User Club Members */}
              <div>
                <h4 className="font-medium mb-3 text-sm">{userClubMatch.name}</h4>
                <div className="space-y-3">
                  {userClubMatch.members.map(member => (
                    <div 
                      key={member.id} 
                      className="flex items-center justify-between cursor-pointer hover:bg-gray-50 rounded p-1"
                      onClick={() => handleMemberClick(member)}
                    >
                      <div className="flex items-center gap-2">
                        <UserAvatar 
                          name={member.name}
                          image={member.avatar} 
                          size="sm"
                        />
                        <span className="text-sm hover:text-primary transition-colors">{member.name}</span>
                      </div>
                      <span className="text-sm font-medium">{member.distanceContribution?.toFixed(1) || "0.0"} km</span>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Opponent Club Members */}
              <div>
                <h4 className="font-medium mb-3 text-sm">{opponentClubMatch.name}</h4>
                <div className="space-y-3">
                  {opponentClubMatch.members.map(member => (
                    <div 
                      key={member.id} 
                      className="flex items-center justify-between cursor-pointer hover:bg-gray-50 rounded p-1"
                      onClick={() => handleMemberClick(member)}
                    >
                      <div className="flex items-center gap-2">
                        <UserAvatar 
                          name={member.name}
                          image={member.avatar} 
                          size="sm"
                        />
                        <span className="text-sm hover:text-primary transition-colors">{member.name}</span>
                      </div>
                      <span className="text-sm font-medium">{member.distanceContribution?.toFixed(1) || "0.0"} km</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CurrentMatchCard;
