
import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Match, Club, ClubMember } from '@/types';
import { Clock, ChevronsUpDown } from 'lucide-react';
import MatchProgressBar from '@/components/shared/MatchProgressBar';
import { Button } from '@/components/ui/button';
import { useNavigation } from '@/hooks/useNavigation';
import { supabase } from '@/integrations/supabase/client';
import UserAvatar from '@/components/shared/UserAvatar';
import { formatLeague } from '@/utils/club/leagueUtils';
import CountdownTimer from './CountdownTimer';
import { getCurrentCycleInfo } from '@/utils/date/matchTiming';
import { cn } from '@/lib/utils';

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
  const [showDetails, setShowDetails] = useState(false);
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
  
  return (
    <Card className="mb-4 overflow-hidden border-2 border-gray-100 shadow-sm">
      <CardContent className="p-0">
        {/* Match header */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 border-b border-gray-100">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <UserAvatar 
                name={userClub.name} 
                image={userClub.logo} 
                size="md"
                className="cursor-pointer"
                onClick={() => handleClubClick(userClub.id, userClub)}
              />
              <div>
                <h3 
                  className="font-semibold cursor-pointer hover:text-primary transition-colors" 
                  onClick={() => handleClubClick(userClub.id, userClub)}
                >
                  {userClub.name}
                </h3>
                <div className="flex items-center gap-1 mt-0.5">
                  <span className="text-xs bg-gray-100 px-2 py-0.5 rounded-full text-gray-600 font-medium">
                    {formatLeague(userClub.division, userClub.tier)}
                  </span>
                </div>
              </div>
            </div>

            <div className="text-center px-2 flex flex-col items-center">
              <span className="text-xs font-bold text-primary mb-1">VS</span>
              {showMatch && (
                <CountdownTimer 
                  useCurrentCycle={true}
                  className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full font-mono" 
                  onComplete={handleCountdownComplete}
                  refreshInterval={500}
                />
              )}
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="text-right">
                <h3 
                  className="font-semibold cursor-pointer hover:text-primary transition-colors" 
                  onClick={() => handleClubClick(opponentClubMatch.id, opponentClubMatch)}
                >
                  {opponentClubMatch.name}
                </h3>
                <div className="flex items-center justify-end gap-1 mt-0.5">
                  <span className="text-xs bg-gray-100 px-2 py-0.5 rounded-full text-gray-600 font-medium">
                    {match.leagueBeforeMatch && formatLeague(
                      (isHome ? match.leagueBeforeMatch.away?.division : match.leagueBeforeMatch.home?.division) as any,
                      (isHome ? match.leagueBeforeMatch.away?.tier : match.leagueBeforeMatch.home?.tier) as any
                    )}
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
        </div>
        
        {/* Match content */}
        <div className="p-4">
          {showMatch ? (
            <>
              <div className="flex justify-between items-center mb-3">
                <div className="text-center flex-1">
                  <span className="block text-xl font-bold text-primary">{userClubMatch.totalDistance.toFixed(1)}</span>
                  <span className="text-xs text-gray-500">kilometers</span>
                </div>
                
                <div className="flex-grow px-4">
                  <MatchProgressBar
                    homeDistance={userClubMatch.totalDistance}
                    awayDistance={opponentClubMatch.totalDistance}
                    className="h-2"
                  />
                </div>
                
                <div className="text-center flex-1">
                  <span className="block text-xl font-bold text-primary">{opponentClubMatch.totalDistance.toFixed(1)}</span>
                  <span className="text-xs text-gray-500">kilometers</span>
                </div>
              </div>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowDetails(!showDetails)}
                className="w-full text-xs flex items-center justify-center mt-1 border border-gray-100 rounded-lg"
              >
                {showDetails ? "Hide Member Details" : "Show Member Details"}
                <ChevronsUpDown size={14} className={cn("ml-1 transition-transform", showDetails ? "rotate-180" : "")} />
              </Button>
              
              {showDetails && (
                <div className="mt-4 grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <h4 className="text-xs font-semibold uppercase text-gray-500 mb-2">{userClub.name}</h4>
                    <div className="space-y-2">
                      {userClubMatch.members.map(member => (
                        <div 
                          key={member.id} 
                          className="flex items-center justify-between text-sm hover:bg-gray-50 p-1.5 rounded-md cursor-pointer transition-colors"
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
                          <span className="font-mono font-medium">{member.distanceContribution?.toFixed(1) || "0.0"}<span className="text-xs text-gray-400 ml-1">km</span></span>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <h4 className="text-xs font-semibold uppercase text-gray-500 mb-2">{opponentClubMatch.name}</h4>
                    <div className="space-y-2">
                      {opponentClubMatch.members.map(member => (
                        <div 
                          key={member.id} 
                          className="flex items-center justify-between text-sm hover:bg-gray-50 p-1.5 rounded-md cursor-pointer transition-colors"
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
                          <span className="font-mono font-medium">{member.distanceContribution?.toFixed(1) || "0.0"}<span className="text-xs text-gray-400 ml-1">km</span></span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="bg-blue-50 p-3 rounded-md text-center my-2">
              <p className="text-sm font-medium text-blue-700 mb-1">Match cooldown period</p>
              <p className="text-xs text-blue-600">Scores are being tallied</p>
              <CountdownTimer 
                useCurrentCycle={true}
                className="text-xs mt-2 font-mono text-primary" 
                onComplete={handleCountdownComplete}
                refreshInterval={500}
              />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default CurrentMatchCard;
