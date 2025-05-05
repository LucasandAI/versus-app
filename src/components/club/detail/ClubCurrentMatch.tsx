
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
  const [showMatchDetails, setShowMatchDetails] = useState(forceShowDetails);
  const {
    navigateToClubDetail
  } = useNavigation();
  const matchEndDateRef = useRef<Date>(new Date(match.endDate));
  const [cycleInfo, setCycleInfo] = useState(getCurrentCycleInfo());

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
    onViewProfile(member.id, member.name, member.avatar);
  };

  const handleClubClick = (club: any) => {
    navigateToClubDetail(club.id, {
      id: club.id,
      name: club.name,
      logo: club.logo,
      members: club.members,
      matchHistory: []
    });
  };

  const handleCountdownComplete = () => {
    console.log('[ClubCurrentMatch] Match ended, refreshing data');
    window.dispatchEvent(new CustomEvent('matchEnded', {
      detail: {
        matchId: match.id
      }
    }));
  };

  // Calculate days left
  const currentDate = new Date();
  const endDate = new Date(match.endDate);
  const daysLeft = Math.ceil((endDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24));
  
  // Only show the match details during the match phase (UNLESS forceShowDetails is true)
  const showMatch = forceShowDetails || cycleInfo.isInMatchPhase;

  return (
    <Card className="shadow-sm bg-white border">
      {showMatch ? (
        <>
          <CardHeader className="pb-2 flex flex-row justify-between items-center">
            <CardTitle className="text-lg">Current Match</CardTitle>
            <div className="bg-amber-50 px-3 py-1 rounded-full text-amber-800 text-sm font-medium">
              {daysLeft} {daysLeft === 1 ? 'day' : 'days'} left
            </div>
          </CardHeader>
          
          <CardContent>
            <div className="flex justify-between items-center mb-4">
              <div className="text-center">
                <h4 className="font-medium text-base">{match.homeClub.name}</h4>
                <p className="font-bold text-lg mt-1">{match.homeClub.totalDistance.toFixed(1)} km</p>
              </div>
              
              <div className="text-center text-gray-500 font-medium">vs</div>
              
              <div className="text-center">
                <h4 className="font-medium text-base cursor-pointer hover:text-primary transition-colors" onClick={() => handleClubClick(match.awayClub)}>
                  {match.awayClub.name}
                </h4>
                <p className="font-bold text-lg mt-1">{match.awayClub.totalDistance.toFixed(1)} km</p>
              </div>
            </div>

            <MatchProgressBar homeDistance={match.homeClub.totalDistance} awayDistance={match.awayClub.totalDistance} className="h-5 mb-4" />
            
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
            
            {/* Member Details Panel */}
            {(showMatchDetails || forceShowDetails) && (
              <div className="mt-4 border-t border-gray-100 pt-4">
                <div className="grid grid-cols-2 divide-x">
                  {/* Home Club Members */}
                  <div className="pr-4">
                    <h4 className="font-medium mb-3 text-sm">{match.homeClub.name} Members</h4>
                    <div className="space-y-3">
                      {match.homeClub.members.map(member => (
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
                      ))}
                    </div>
                  </div>
                  
                  {/* Away Club Members */}
                  <div className="pl-4">
                    <h4 className="font-medium mb-3 text-sm">{match.awayClub.name} Members</h4>
                    <div className="space-y-3">
                      {match.awayClub.members.map(member => (
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
                      ))}
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
                    <h4 className="font-medium">{match.homeClub.name}</h4>
                    <p className="font-bold text-lg mt-1">{match.homeClub.totalDistance.toFixed(1)} km</p>
                  </div>
                  
                  <div className="text-center text-gray-500 font-medium">vs</div>
                  
                  <div className="text-center">
                    <h4 className="font-medium cursor-pointer hover:text-primary transition-colors" onClick={() => handleClubClick(match.awayClub)}>
                      {match.awayClub.name}
                    </h4>
                    <p className="font-bold text-lg mt-1">{match.awayClub.totalDistance.toFixed(1)} km</p>
                  </div>
                </div>

                <MatchProgressBar homeDistance={match.homeClub.totalDistance} awayDistance={match.awayClub.totalDistance} className="h-5 mb-4" />

                <div className="mt-4 pt-4">
                  <div className="grid grid-cols-2 divide-x">
                    {/* Home Club Members */}
                    <div className="pr-4">
                      <h4 className="font-medium mb-3 text-sm">{match.homeClub.name} Members</h4>
                      <div className="space-y-3">
                        {match.homeClub.members.map(member => (
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
                        ))}
                      </div>
                    </div>
                    
                    {/* Away Club Members */}
                    <div className="pl-4">
                      <h4 className="font-medium mb-3 text-sm">{match.awayClub.name} Members</h4>
                      <div className="space-y-3">
                        {match.awayClub.members.map(member => (
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
                        ))}
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
