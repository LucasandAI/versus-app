
import React, { useState, useEffect, useRef } from 'react';
import { Match } from '@/types';
import UserAvatar from '@/components/shared/UserAvatar';
import { ChevronDown, Clock } from 'lucide-react';
import MatchProgressBar from '@/components/shared/MatchProgressBar';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigation } from '@/hooks/useNavigation';
import { formatLeague } from '@/utils/club/leagueUtils';
import CountdownTimer from '@/components/match/CountdownTimer';
import { getCurrentCycleInfo } from '@/utils/date/matchTiming';
import { useApp } from '@/context/AppContext';

interface ClubCurrentMatchProps {
  match: Match;
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

  if (!match || !match.homeClub || !match.awayClub) {
    console.error('[ClubCurrentMatch] Missing required match data:', match);
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

  const [showMatchDetails, setShowMatchDetails] = useState(forceShowDetails);
  const { navigateToClubDetail } = useNavigation();
  const matchEndDateRef = useRef<Date>(new Date(match.endDate));
  const [cycleInfo, setCycleInfo] = useState(getCurrentCycleInfo());
  const { selectedClub } = useApp();
  
  // Determine if the current club is home or away
  const isHomeClub = selectedClub && selectedClub.id === match.homeClub.id;
  // Use safe fallbacks when determining current and opponent clubs
  const currentClub = isHomeClub ? match.homeClub : match.awayClub;
  const opponentClub = isHomeClub ? match.awayClub : match.homeClub;

  // Update match end time reference if match data changes
  useEffect(() => {
    const endDate = new Date(match.endDate);
    if (endDate.getTime() !== matchEndDateRef.current.getTime()) {
      matchEndDateRef.current = endDate;
    }

    // Update cycle info periodically
    const cycleTimer = setInterval(() => {
      setCycleInfo(getCurrentCycleInfo());
    }, 1000);

    // Update initial show state based on prop
    if (forceShowDetails && !showMatchDetails) {
      setShowMatchDetails(true);
    }
    return () => {
      clearInterval(cycleTimer);
    };
  }, [match, forceShowDetails]);

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

  return (
    <Card className="shadow-sm">
      {showMatch ? (
        <>
          <CardHeader className="pb-2">
            <div className="flex justify-between items-center">
              <CardTitle className="text-lg">Current Match</CardTitle>
              <div className="flex items-center text-amber-800 text-sm">
                <Clock className="h-4 w-4 mr-1" />
                <span>Match ends in: </span>
                <CountdownTimer 
                  useCurrentCycle={true} 
                  className="font-mono ml-1" 
                  onComplete={handleCountdownComplete} 
                  refreshInterval={500} 
                />
              </div>
            </div>
          </CardHeader>
          
          <CardContent>
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
            
            {!forceShowDetails && (
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full mt-2 mb-1 text-sm flex items-center justify-center bg-gray-50 hover:bg-gray-100 border-gray-200" 
                onClick={() => setShowMatchDetails(!showMatchDetails)}
              >
                {showMatchDetails ? 'Hide Details' : 'Show Details'} 
                <ChevronDown className={`ml-1 h-4 w-4 transition-transform ${showMatchDetails ? 'rotate-180' : ''}`} />
              </Button>
            )}
            
            {/* Member Details Panel - Now always shown when forceShowDetails is true */}
            {(showMatchDetails || forceShowDetails) && (
              <div className="mt-4 border-t border-gray-100 pt-4">
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
                                className="cursor-pointer" 
                                onClick={e => {
                                  e && e.stopPropagation();
                                  handleMemberClick(member);
                                }} 
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
                                className="cursor-pointer" 
                                onClick={e => {
                                  e && e.stopPropagation();
                                  handleMemberClick(member);
                                }} 
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
            )}
          </CardContent>
        </>
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
                                  className="cursor-pointer" 
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
                                  className="cursor-pointer" 
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
