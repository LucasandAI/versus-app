
import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Match, Club, ClubMember } from '@/types';
import { ChevronsUpDown, Clock } from 'lucide-react';
import MatchProgressBar from '@/components/shared/MatchProgressBar';
import { Button } from '@/components/ui/button';
import { useNavigation } from '@/hooks/useNavigation';
import { supabase } from '@/integrations/supabase/client';
import UserAvatar from '@/components/shared/UserAvatar';
import { formatLeague } from '@/utils/club/leagueUtils';
import CountdownTimer from './CountdownTimer';
import { getCurrentCycleInfo } from '@/utils/date/matchTiming';

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
  const [showDetails, setShowDetails] = useState(true); // Default to showing details
  const [match, setMatch] = useState(initialMatch);
  const [userClub, setUserClub] = useState(initialUserClub);
  const matchEndDateRef = useRef<Date>(new Date(initialMatch.endDate));
  const [cycleInfo, setCycleInfo] = useState(getCurrentCycleInfo());
  
  const { navigateToClubDetail } = useNavigation();
  
  // Determine if user club is home or away
  const isHome = match.homeClub.id === userClub.id;
  const userClubMatch = isHome ? match.homeClub : match.awayClub;
  const opponentClubMatch = isHome ? match.awayClub : match.homeClub;
  
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

    // Update cycle info periodically
    const cycleTimer = setInterval(() => {
      setCycleInfo(getCurrentCycleInfo());
    }, 1000);

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
      clearInterval(cycleTimer);
      supabase.removeChannel(distanceChannel);
      window.removeEventListener('matchDistanceUpdated', handleMatchUpdate as EventListener);
      window.removeEventListener('matchUpdated', handleMatchUpdate as EventListener);
      window.removeEventListener('userDataUpdated', () => {
        setMatch(initialMatch);
        setUserClub(initialUserClub);
      });
    };
  }, [initialMatch, initialUserClub]);

  // Get member contribution data
  const handleMemberClick = (member: ClubMember) => {
    onViewProfile(member.id, member.name, member.avatar);
  };

  const handleClubClick = (clubId: string, clubData: any) => {
    navigateToClubDetail(clubId, clubData);
  };

  const handleCountdownComplete = () => {
    console.log('[CurrentMatchCard] Countdown complete, match ended');
    window.dispatchEvent(new CustomEvent('matchEnded', { 
      detail: { matchId: match.id } 
    }));
  };
  
  // Only show the match details during the match phase
  const showMatch = cycleInfo.isInMatchPhase;
  
  // Determine if we have enough members to show full match details
  const hasEnoughMembers = userClubMatch.members.length >= 5 && opponentClubMatch.members.length >= 5;
  
  // Calculate days left for display
  const daysLeft = Math.ceil((new Date(match.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
  
  return (
    <Card className="mb-4 overflow-hidden">
      <CardContent className="p-4">
        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center">
            <UserAvatar 
              name={userClub.name} 
              image={userClub.logo} 
              size="md"
              className="mr-2 cursor-pointer"
              onClick={() => handleClubClick(userClub.id, userClub)}
            />
            <div>
              <h3 
                className="font-medium cursor-pointer hover:text-primary transition-colors" 
                onClick={() => handleClubClick(userClub.id, userClub)}
              >
                {userClub.name}
              </h3>
              <div className="flex items-center gap-1 mt-0.5">
                <span className="text-xs bg-gray-100 px-2 py-0.5 rounded text-gray-600">
                  {formatLeague(userClub.division, userClub.tier)}
                </span>
                <span className="text-xs text-gray-500">
                  • {userClub.members.length}/5 members
                </span>
              </div>
            </div>
          </div>
          
          <div className="text-center px-2">
            <span className="text-xs font-medium text-gray-500 uppercase">VS</span>
          </div>
          
          <div className="flex items-center">
            <div className="text-right mr-2">
              <h3 
                className="font-medium cursor-pointer hover:text-primary transition-colors" 
                onClick={() => handleClubClick(opponentClubMatch.id, opponentClubMatch)}
              >
                {opponentClubMatch.name}
              </h3>
              <div className="flex items-center justify-end gap-1 mt-0.5">
                <span className="text-xs bg-gray-100 px-2 py-0.5 rounded text-gray-600">
                  {match.leagueBeforeMatch && formatLeague(
                    (isHome ? match.leagueBeforeMatch.away?.division : match.leagueBeforeMatch.home?.division) as any,
                    (isHome ? match.leagueBeforeMatch.away?.tier : match.leagueBeforeMatch.home?.tier) as any
                  )}
                </span>
                <span className="text-xs text-gray-500">
                  • {opponentClubMatch.members.length}/5 members
                </span>
              </div>
            </div>
            <UserAvatar 
              name={opponentClubMatch.name} 
              image={opponentClubMatch.logo} 
              size="md"
              className="cursor-pointer"
              onClick={() => handleClubClick(opponentClubMatch.id, opponentClubMatch)}
            />
          </div>
        </div>
        
        {/* Match Content Section */}
        {showMatch ? (
          <>
            {/* Current Match Header */}
            <div className="flex justify-between items-center mt-4 mb-2">
              <h3 className="font-medium text-sm">Current Match</h3>
              <div className="bg-amber-50 text-amber-800 px-2 py-0.5 rounded-full text-xs font-medium">
                {daysLeft} {daysLeft === 1 ? 'day' : 'days'} left
              </div>
            </div>
            
            {/* Match Progress Section */}
            <div className="flex justify-between items-center mb-2 font-medium">
              <span className="text-lg">{userClubMatch.totalDistance.toFixed(1)} km</span>
              <span className="text-lg">{opponentClubMatch.totalDistance.toFixed(1)} km</span>
            </div>
            
            <MatchProgressBar
              homeDistance={userClubMatch.totalDistance}
              awayDistance={opponentClubMatch.totalDistance}
            />
            
            {/* Match Details - Always shown during active match */}
            <div className="mt-4">
              <div className="flex justify-between items-center mb-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowDetails(!showDetails)}
                  className="text-xs flex items-center"
                >
                  {showDetails ? "Hide Details" : "Show Details"}
                  <ChevronsUpDown size={14} className={`ml-1 transition-transform ${showDetails ? 'rotate-180' : ''}`} />
                </Button>
                
                <div className="text-xs text-gray-500 flex items-center">
                  <Clock size={14} className="mr-1" />
                  <CountdownTimer 
                    useCurrentCycle={true}
                    showPhaseLabel={false}
                    className="inline" 
                    onComplete={handleCountdownComplete}
                    refreshInterval={500}
                  />
                </div>
              </div>
              
              {showDetails && (
                <div className="grid grid-cols-2 gap-3 bg-gray-50 p-3 rounded-md">
                  <div>
                    <h4 className="text-sm font-medium mb-2">Home Club Members</h4>
                    <div className="space-y-1">
                      {userClubMatch.members.map(member => (
                        <div 
                          key={member.id} 
                          className="flex items-center justify-between text-xs hover:bg-gray-100 p-1 rounded cursor-pointer"
                          onClick={() => handleMemberClick(member)}
                        >
                          <div className="flex items-center">
                            <UserAvatar 
                              name={member.name} 
                              image={member.avatar} 
                              size="xs"
                              className="mr-2 cursor-pointer"
                              onClick={(e) => {
                                e && e.stopPropagation();
                                handleMemberClick(member);
                              }}
                            />
                            <span className="hover:text-primary transition-colors">{member.name}</span>
                          </div>
                          <span>{member.distanceContribution?.toFixed(1) || "0.0"} km</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium mb-2">Away Club Members</h4>
                    <div className="space-y-1">
                      {opponentClubMatch.members.map(member => (
                        <div 
                          key={member.id} 
                          className="flex items-center justify-between text-xs hover:bg-gray-100 p-1 rounded cursor-pointer"
                          onClick={() => handleMemberClick(member)}
                        >
                          <div className="flex items-center">
                            <UserAvatar 
                              name={member.name} 
                              image={member.avatar} 
                              size="xs"
                              className="mr-2 cursor-pointer"
                              onClick={(e) => {
                                e && e.stopPropagation();
                                handleMemberClick(member);
                              }}
                            />
                            <span className="hover:text-primary transition-colors">{member.name}</span>
                          </div>
                          <span>{member.distanceContribution?.toFixed(1) || "0.0"} km</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="bg-blue-50 p-3 rounded-md text-center my-2">
            <p className="text-sm font-medium text-blue-700 mb-1">Match cooldown period</p>
            <p className="text-xs text-blue-600">Scores are being tallied</p>
            
            <div className="mt-3 flex justify-between items-center">
              <div className="text-xs text-gray-500 flex items-center">
                <Clock size={14} className="mr-1" />
                <CountdownTimer 
                  useCurrentCycle={true}
                  showPhaseLabel={true}
                  className="inline" 
                  onComplete={handleCountdownComplete}
                  refreshInterval={500}
                />
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CurrentMatchCard;
