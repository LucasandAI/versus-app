
import React, { useState, useEffect, useRef } from 'react';
import { Match, Club } from '@/types';
import UserAvatar from '@/components/shared/UserAvatar';
import { ChevronDown, Clock } from 'lucide-react';
import MatchProgressBar from '@/components/shared/MatchProgressBar';
import { Card, CardContent } from "@/components/ui/card";
import { useNavigation } from '@/hooks/useNavigation';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Button } from '@/components/ui/button';
import CountdownTimer from '@/components/match/CountdownTimer';
import { getCurrentCycleInfo } from '@/utils/date/matchTiming';
import { useApp } from '@/context/AppContext';
import SearchOpponentButton from '@/components/match/SearchOpponentButton';
import NeedMoreMembersCard from '@/components/match/NeedMoreMembersCard';

interface ClubCurrentMatchProps {
  match?: Match;
  onViewProfile: (userId: string, name: string, avatar?: string) => void;
  forceShowDetails?: boolean; // Prop to force showing details
}

const ClubCurrentMatch: React.FC<ClubCurrentMatchProps> = ({
  match,
  onViewProfile,
  forceShowDetails = false
}) => {
  console.log('[ClubCurrentMatch] Rendering with match data:', {
    matchId: match?.id,
    homeClub: match?.homeClub,
    awayClub: match?.awayClub,
    status: match?.status,
    forceShowDetails
  });

  const [showMemberContributions, setShowMemberContributions] = useState(forceShowDetails);
  const [cycleInfo, setCycleInfo] = useState(getCurrentCycleInfo());
  const { navigateToClubDetail } = useNavigation();
  const matchEndDateRef = useRef<Date | null>(match ? new Date(match.endDate) : null);
  const { selectedClub } = useApp();

  // No match and no selected club means we can't show anything
  if (!match && !selectedClub) {
    console.error('[ClubCurrentMatch] Missing both match and selectedClub data');
    return (
      <Card className="shadow-sm">
        <CardContent className="p-4">
          <div className="text-center py-4 text-gray-500">
            Match data is unavailable
          </div>
        </CardContent>
      </Card>
    );
  }

  // If no match but we have a club, show the appropriate state (search button or need more members)
  if (!match && selectedClub) {
    const hasEnoughMembers = selectedClub.members && selectedClub.members.length >= 5;

    if (hasEnoughMembers) {
      return (
        <Card className="shadow-md">
          <CardContent className="p-4">
            <div className="bg-blue-50 p-3 rounded-md text-center my-3">
              <p className="font-medium mb-3">Ready to compete</p>
              <SearchOpponentButton club={selectedClub} />
            </div>
          </CardContent>
        </Card>
      );
    } else {
      return <NeedMoreMembersCard club={selectedClub} hideHeader={true} />;
    }
  }
  
  // From here on, we know we have a match
  if (!match || !match.homeClub || !match.awayClub) {
    return null;
  }

  // Determine if the current club is home or away
  const isHomeClub = selectedClub && selectedClub.id === match.homeClub.id;
  // Use safe fallbacks when determining current and opponent clubs
  const currentClub = isHomeClub ? match.homeClub : match.awayClub;
  const opponentClub = isHomeClub ? match.awayClub : match.homeClub;

  // Moving the hook calls outside of the render to ensure consistent hook calls
  const handleMemberClick = (member: any) => {
    if (member && member.id) {
      onViewProfile(member.id, member.name || 'Unknown', member.avatar);
    }
  };

  const handleClubClick = (club: any) => {
    if (club && club.id) {
      navigateToClubDetail(club.id, {
        id: club.id,
        name: club.name || 'Unknown Club',
        logo: club.logo || '/placeholder.svg',
        members: club.members || [],
        matchHistory: []
      });
    }
  };

  const handleCountdownComplete = () => {
    console.log('[ClubCurrentMatch] Match ended, refreshing data');
    window.dispatchEvent(new CustomEvent('matchEnded', {
      detail: {
        matchId: match.id
      }
    }));
  };

  // Only show the match details during the match phase (UNLESS forceShowDetails is true)
  const showMatch = forceShowDetails || cycleInfo.isInMatchPhase;

  // Use a single useEffect for all functionality - ALWAYS called regardless of conditions
  useEffect(() => {
    if (match) {
      const endDate = new Date(match.endDate);
      if (!matchEndDateRef.current || endDate.getTime() !== matchEndDateRef.current.getTime()) {
        matchEndDateRef.current = endDate;
      }
    }

    // Update cycle info periodically
    const cycleTimer = setInterval(() => {
      setCycleInfo(getCurrentCycleInfo());
    }, 1000);

    // Update initial show state based on prop
    if (forceShowDetails && !showMemberContributions) {
      setShowMemberContributions(true);
    }
    
    return () => {
      clearInterval(cycleTimer);
    };
  }, [match, forceShowDetails, showMemberContributions]);
  
  return (
    <Card className="overflow-hidden border-0 shadow-md">
      {showMatch ? (
        <CardContent className="p-4">
          {/* Match in Progress Notification */}
          <div className="p-3 rounded-md mb-4 bg-inherit">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold">Match in progress</h3>
              <div className="flex items-center text-amber-800 text-sm">
                <Clock className="h-4 w-4 mr-1" />
                <span>Time remaining: </span>
                <CountdownTimer
                  targetDate={matchEndDateRef.current!}
                  className="font-mono ml-1"
                  onComplete={handleCountdownComplete}
                  refreshInterval={500}
                />
              </div>
            </div>
          </div>
          
          {/* Clubs Matchup */}
          <div className="flex justify-between items-center mb-6">
            {/* Current Club (always on left) */}
            <div className="text-center">
              <div className="flex flex-col items-center cursor-pointer" onClick={() => handleClubClick(currentClub)}>
                <UserAvatar name={currentClub.name} image={currentClub.logo} size="md" className="mb-2" />
                <h4 className="font-medium text-sm hover:text-primary transition-colors">
                  {currentClub.name}
                </h4>
              </div>
            </div>
            
            <div className="text-center text-gray-500 font-medium">vs</div>
            
            {/* Opponent Club (always on right) */}
            <div className="text-center">
              <div className="flex flex-col items-center cursor-pointer" onClick={() => handleClubClick(opponentClub)}>
                <UserAvatar name={opponentClub.name} image={opponentClub.logo} size="md" className="mb-2" />
                <h4 className="font-medium text-sm hover:text-primary transition-colors">
                  {opponentClub.name}
                </h4>
              </div>
            </div>
          </div>
          
          {/* Match Progress Bar */}
          <MatchProgressBar homeDistance={currentClub.totalDistance} awayDistance={opponentClub.totalDistance} className="h-5" />
          
          {/* Member Contributions Toggle Button */}
          <Collapsible open={showMemberContributions} onOpenChange={setShowMemberContributions}>
            <CollapsibleTrigger asChild>
              <Button variant="outline" size="sm" className="w-full mt-4 text-sm flex items-center justify-center bg-gray-50 hover:bg-gray-100 border-gray-200">
                {showMemberContributions ? 'Hide Member Contributions' : 'Show Member Contributions'} 
                <ChevronDown className={`ml-1 h-4 w-4 transition-transform ${showMemberContributions ? 'rotate-180' : ''}`} />
              </Button>
            </CollapsibleTrigger>
            
            <CollapsibleContent>
              <div className="border-t border-gray-100 pt-4 mt-2">
                <div className="grid grid-cols-2 gap-4">
                  {/* Current Club Members */}
                  <div>
                    <h4 className="font-medium mb-3 text-sm">{currentClub.name}</h4>
                    <div className="space-y-3">
                      {currentClub.members && currentClub.members.length > 0 ? (
                        currentClub.members.map(member => (
                          <div key={member.id} className="flex items-center justify-between cursor-pointer hover:bg-gray-50 rounded p-1" onClick={() => handleMemberClick(member)}>
                            <div className="flex items-center gap-2">
                              <UserAvatar name={member.name} image={member.avatar} size="sm" />
                              <span className="text-sm hover:text-primary transition-colors">{member.name}</span>
                            </div>
                            <span className="text-sm font-medium">{member.distanceContribution?.toFixed(1) || "0.0"} km</span>
                          </div>
                        ))
                      ) : (
                        <div className="text-sm text-gray-500 py-2">No members found</div>
                      )}
                    </div>
                  </div>
                  
                  {/* Opponent Club Members */}
                  <div>
                    <h4 className="font-medium mb-3 text-sm">{opponentClub.name}</h4>
                    <div className="space-y-3">
                      {opponentClub && opponentClub.members && opponentClub.members.length > 0 ? (
                        opponentClub.members.map(member => (
                          <div key={member.id} className="flex items-center justify-between cursor-pointer hover:bg-gray-50 rounded p-1" onClick={() => handleMemberClick(member)}>
                            <div className="flex items-center gap-2">
                              <UserAvatar name={member.name} image={member.avatar} size="sm" />
                              <span className="text-sm hover:text-primary transition-colors">{member.name}</span>
                            </div>
                            <span className="text-sm font-medium">{member.distanceContribution?.toFixed(1) || "0.0"} km</span>
                          </div>
                        ))
                      ) : (
                        <div className="text-sm text-gray-500 py-2">No members found</div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </CardContent>
      ) : (
        <CardContent>
          <div className="bg-blue-50 p-3 rounded-md text-center my-3">
            <p className="text-sm font-medium text-blue-700">Match cooldown period</p>
            <p className="text-xs text-blue-600">
              <CountdownTimer 
                useCurrentCycle={true} 
                showPhaseLabel={true} 
                className="inline" 
                onComplete={handleCountdownComplete} 
                refreshInterval={500} 
              />
            </p>
            
            {/* Always show match details during cooldown if forceShowDetails is true */}
            {forceShowDetails && (
              <div className="mt-4 pt-4 border-t border-blue-100">
                <div className="flex justify-between items-center mb-4">
                  <div className="text-center">
                    <h4 className="font-medium">{currentClub?.name || 'Current Club'}</h4>
                    <p className="font-bold text-lg mt-1">{currentClub?.totalDistance?.toFixed(1) || "0.0"} km</p>
                  </div>
                  
                  <div className="text-center text-gray-500 font-medium">vs</div>
                  
                  <div className="text-center">
                    <h4 className="font-medium cursor-pointer hover:text-primary transition-colors" onClick={() => handleClubClick(opponentClub)}>
                      {opponentClub?.name || 'Opponent Club'}
                    </h4>
                    <p className="font-bold text-lg mt-1">{opponentClub?.totalDistance?.toFixed(1) || "0.0"} km</p>
                  </div>
                </div>

                <MatchProgressBar 
                  homeDistance={match.homeClub?.totalDistance || 0} 
                  awayDistance={match.awayClub?.totalDistance || 0} 
                  className="h-5 mb-4" 
                />

                <div className="mt-4 pt-4">
                  <div className="grid grid-cols-2 divide-x">
                    {/* Current Club Members */}
                    <div className="pr-4">
                      <h4 className="font-medium mb-3 text-sm">{currentClub?.name || 'Current Club'} Members</h4>
                      <div className="space-y-3">
                        {currentClub && Array.isArray(currentClub.members) && currentClub.members.length > 0 ? (
                          currentClub.members.map(member => (
                            <div 
                              key={member.id} 
                              className="flex items-center justify-between cursor-pointer hover:bg-gray-50 rounded p-1" 
                              onClick={() => handleMemberClick(member)}
                            >
                              <div className="flex items-center gap-2">
                                <UserAvatar 
                                  name={member.name || 'Unknown'} 
                                  image={member.avatar} 
                                  size="sm" 
                                />
                                <span className="text-sm hover:text-primary transition-colors">{member.name || 'Unknown'}</span>
                              </div>
                              <span className="text-sm font-medium">{member.distanceContribution?.toFixed(1) || "0.0"} km</span>
                            </div>
                          ))
                        ) : (
                          <div className="text-sm text-gray-500 py-2">No members found</div>
                        )}
                      </div>
                    </div>
                    
                    {/* Opponent Club Members */}
                    <div className="pl-4">
                      <h4 className="font-medium mb-3 text-sm">{opponentClub?.name || 'Opponent Club'} Members</h4>
                      <div className="space-y-3">
                        {opponentClub && Array.isArray(opponentClub.members) && opponentClub.members.length > 0 ? (
                          opponentClub.members.map(member => (
                            <div 
                              key={member.id} 
                              className="flex items-center justify-between cursor-pointer hover:bg-gray-50 rounded p-1" 
                              onClick={() => handleMemberClick(member)}
                            >
                              <div className="flex items-center gap-2">
                                <UserAvatar 
                                  name={member.name || 'Unknown'} 
                                  image={member.avatar} 
                                  size="sm" 
                                />
                                <span className="text-sm hover:text-primary transition-colors">{member.name || 'Unknown'}</span>
                              </div>
                              <span className="text-sm font-medium">{member.distanceContribution?.toFixed(1) || "0.0"} km</span>
                            </div>
                          ))
                        ) : (
                          <div className="text-sm text-gray-500 py-2">No members found</div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      )}
    </Card>
  );
};

export default ClubCurrentMatch;
