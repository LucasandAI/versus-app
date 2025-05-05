
import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Match, Club, ClubMember } from '@/types';
import { ChevronDown } from 'lucide-react';
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
  
  // Calculate days remaining
  const currentDate = new Date();
  const endDate = new Date(match.endDate);
  const daysLeft = Math.ceil((endDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24));
  
  // Check if it's in match phase - needed for proper UI rendering
  const isInMatchPhase = cycleInfo.isInMatchPhase; 
  
  return (
    <Card className="mb-4 overflow-hidden bg-white border shadow-sm">
      {/* Club Header */}
      <CardHeader className="p-4 border-b border-gray-100">
        <div className="flex items-center">
          <UserAvatar 
            name={userClub.name} 
            image={userClub.logo} 
            size="md"
            className="mr-3 cursor-pointer"
            onClick={() => handleClubClick(userClub.id, userClub)}
          />
          <div>
            <h3 
              className="font-semibold cursor-pointer hover:text-primary transition-colors" 
              onClick={() => handleClubClick(userClub.id, userClub)}
            >
              {userClub.name}
            </h3>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs bg-gray-100 px-2 py-0.5 rounded-full text-gray-600">
                {formatLeague(userClub.division, userClub.tier)}
              </span>
              <span className="text-xs text-gray-500">
                • {userClub.members.length} members
              </span>
            </div>
          </div>
        </div>
      </CardHeader>
      
      {/* Match Content */}
      <CardContent className="p-4">
        {isInMatchPhase ? (
          <>
            {/* Match in Progress */}
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold">Current Match</h3>
              <div className="bg-amber-50 px-3 py-1 rounded-full text-amber-800 text-sm font-medium">
                {daysLeft} {daysLeft === 1 ? 'day' : 'days'} left
              </div>
            </div>
            
            {/* Clubs Matchup */}
            <div className="flex justify-between items-center mb-4">
              <div className="text-center">
                <h4 className="font-medium">{userClubMatch.name}</h4>
                <p className="font-bold text-lg mt-1">{userClubMatch.totalDistance.toFixed(1)} km</p>
              </div>
              
              <div className="text-center text-gray-500 font-medium">vs</div>
              
              <div className="text-center">
                <h4 
                  className="font-medium cursor-pointer hover:text-primary transition-colors"
                  onClick={() => handleClubClick(opponentClubMatch.id, opponentClubMatch)}
                >
                  {opponentClubMatch.name}
                </h4>
                <p className="font-bold text-lg mt-1">{opponentClubMatch.totalDistance.toFixed(1)} km</p>
              </div>
            </div>
            
            {/* Match Progress Bar */}
            <div className="mt-6">
              <MatchProgressBar
                homeDistance={userClubMatch.totalDistance}
                awayDistance={opponentClubMatch.totalDistance}
                className="h-5 mb-4"
              />
            </div>
            
            {/* Details Toggle Button */}
            <Button 
              variant="outline"
              size="sm"
              className="w-full mt-2 mb-1 text-sm flex items-center justify-center bg-gray-50 hover:bg-gray-100 border-gray-200"
              onClick={() => setShowDetails(!showDetails)}
            >
              {showDetails ? 'Hide Details' : 'Show Details'} 
              <ChevronDown className={`ml-1 h-4 w-4 transition-transform ${showDetails ? 'rotate-180' : ''}`} />
            </Button>
          </>
        ) : (
          /* Match Cooldown Period */
          <div className="bg-blue-50 p-3 rounded-md text-center my-3">
            <p className="text-sm font-medium text-blue-700 mb-1">Match cooldown period</p>
            <p className="text-xs text-blue-600">
              <CountdownTimer 
                useCurrentCycle={true}
                showPhaseLabel={true}
                className="inline" 
                onComplete={handleCountdownComplete}
                refreshInterval={500}
              />
            </p>
          </div>
        )}
      
        {/* Member Details Panel */}
        {isInMatchPhase && showDetails && (
          <div className="border-t border-gray-100 pt-4 mt-4">
            <div className="grid grid-cols-2 divide-x">
              {/* User Club Members */}
              <div className="pr-4">
                <h4 className="font-medium mb-3 text-sm">{userClubMatch.name} Members</h4>
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
                          className="cursor-pointer"
                          onClick={(e) => {
                            e && e.stopPropagation();
                            handleMemberClick(member);
                          }}
                        />
                        <span className="text-sm hover:text-primary transition-colors">{member.name}</span>
                      </div>
                      <span className="text-sm font-medium">{member.distanceContribution?.toFixed(1) || "0.0"} km</span>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Opponent Club Members */}
              <div className="pl-4">
                <h4 className="font-medium mb-3 text-sm">{opponentClubMatch.name} Members</h4>
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
                          className="cursor-pointer"
                          onClick={(e) => {
                            e && e.stopPropagation();
                            handleMemberClick(member);
                          }}
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
