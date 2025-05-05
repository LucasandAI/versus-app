
import React, { useState, useEffect, useRef } from 'react';
import { Match } from '@/types';
import UserAvatar from '@/components/shared/UserAvatar';
import { getCurrentCycleInfo } from '@/utils/date/matchTiming';
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from '@/components/ui/card';
import { calculateClubTotal, formatDistance } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import MatchProgressBar from '@/components/shared/MatchProgressBar';

interface ClubCurrentMatchProps {
  match: Match;
  onViewProfile?: (userId: string, name: string, avatar?: string) => void;
}

const ClubCurrentMatch: React.FC<ClubCurrentMatchProps> = ({ match, onViewProfile }) => {
  const [cycleInfo, setCycleInfo] = useState(getCurrentCycleInfo());
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const [showScoreboard, setShowScoreboard] = useState(true);
  const [addingDistance, setAddingDistance] = useState(false);
  const [distance, setDistance] = useState('');

  useEffect(() => {
    // Update cycle info every second
    timerRef.current = setInterval(() => {
      setCycleInfo(getCurrentCycleInfo());
    }, 1000);
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);
  
  const homeTotal = calculateClubTotal(match.homeClub);
  const awayTotal = calculateClubTotal(match.awayClub);
  
  const handleToggleScoreboard = () => {
    setShowScoreboard(prev => !prev);
  };
  
  const handleAddDistance = () => {
    setAddingDistance(true);
  };
  
  const handleDistanceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Allow only numeric values with max 2 decimal places
    const value = e.target.value;
    if (/^\d*\.?\d{0,2}$/.test(value)) {
      setDistance(value);
    }
  };
  
  const handleSubmitDistance = (e: React.FormEvent) => {
    e.preventDefault();
    
    // TODO: Submit distance to API
    console.log(`Distance submitted: ${distance}`);
    
    // Reset form
    setAddingDistance(false);
    setDistance('');
    
    // Optimistically update UI
    // This is just a placeholder - the actual implementation would update the match data
    setShowScoreboard(true);
  };
  
  // Always show match details for active matches regardless of phase
  // We only want to hide details if explicitly in cooldown phase
  const showMatch = match.status === 'active';

  // Handle member click if onViewProfile is provided
  const handleMemberClick = (userId: string, name: string, avatar?: string) => {
    if (onViewProfile) {
      onViewProfile(userId, name, avatar);
    }
  };

  return (
    <div className="mt-6">
      <Card>
        <CardHeader>
          <CardTitle>Current Match</CardTitle>
          <CardDescription>
            {match.status === 'active' ? 'In progress' : 'Starting soon'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {showMatch ? (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <button 
                  className={`text-sm font-medium ${showScoreboard ? 'text-blue-600' : 'text-gray-500'}`}
                  onClick={handleToggleScoreboard}
                >
                  Scoreboard
                </button>
                <button 
                  className={`text-sm font-medium ${!showScoreboard ? 'text-blue-600' : 'text-gray-500'}`}
                  onClick={handleToggleScoreboard}
                >
                  Leaderboard
                </button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleAddDistance}
                  disabled={addingDistance}
                >
                  Add Distance
                </Button>
              </div>
              
              {addingDistance ? (
                <form onSubmit={handleSubmitDistance} className="space-y-4">
                  <div>
                    <label htmlFor="distance" className="block text-sm font-medium">
                      Distance (km)
                    </label>
                    <input
                      type="text"
                      id="distance"
                      value={distance}
                      onChange={handleDistanceChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                      placeholder="Enter distance in km"
                      autoFocus
                    />
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm"
                      onClick={() => setAddingDistance(false)}
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit" 
                      size="sm"
                      disabled={!distance}
                    >
                      Submit
                    </Button>
                  </div>
                </form>
              ) : showScoreboard ? (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <div className="flex flex-col items-center">
                      <div className="h-16 w-16 rounded-full bg-gray-100 flex items-center justify-center mb-1">
                        <img 
                          src={match.homeClub.logo || '/placeholder.svg'} 
                          alt={match.homeClub.name}
                          className="h-12 w-12 rounded-full object-cover"
                        />
                      </div>
                      <div className="text-sm font-medium">{match.homeClub.name}</div>
                    </div>
                    
                    <div className="text-center px-4">
                      <div className="text-xl font-bold">
                        {formatDistance(homeTotal)} - {formatDistance(awayTotal)}
                      </div>
                      <div className="text-xs text-gray-500">
                        Distance (km)
                      </div>
                    </div>
                    
                    <div className="flex flex-col items-center">
                      <div className="h-16 w-16 rounded-full bg-gray-100 flex items-center justify-center mb-1">
                        <img 
                          src={match.awayClub.logo || '/placeholder.svg'} 
                          alt={match.awayClub.name}
                          className="h-12 w-12 rounded-full object-cover"
                        />
                      </div>
                      <div className="text-sm font-medium">{match.awayClub.name}</div>
                    </div>
                  </div>
                  
                  <MatchProgressBar 
                    homeDistance={homeTotal} 
                    awayDistance={awayTotal}
                  />
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Home club members */}
                  <div>
                    <h4 className="text-sm font-semibold mb-2">{match.homeClub.name}</h4>
                    <div className="space-y-2">
                      {match.homeClub.members.map(member => (
                        <div key={member.id} className="flex items-center justify-between">
                          <div className="flex items-center">
                            <UserAvatar name={member.name} image={member.avatar} size="sm" />
                            <span className="ml-2 text-sm">{member.name}</span>
                          </div>
                          <span className="text-sm font-medium">{formatDistance(member.distanceContribution)} km</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="border-t border-gray-200 my-4"></div>
                  
                  {/* Away club members */}
                  <div>
                    <h4 className="text-sm font-semibold mb-2">{match.awayClub.name}</h4>
                    <div className="space-y-2">
                      {match.awayClub.members.map(member => (
                        <div key={member.id} className="flex items-center justify-between">
                          <div className="flex items-center">
                            <UserAvatar name={member.name} image={member.avatar} size="sm" />
                            <span className="ml-2 text-sm">{member.name}</span>
                          </div>
                          <span className="text-sm font-medium">{formatDistance(member.distanceContribution)} km</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
              
            </div>
          ) : (
            <div className="py-8 text-center">
              <p className="text-gray-500">
                The match is currently in cooldown phase.
              </p>
              <p className="text-sm text-gray-400 mt-2">
                Details will be available when the next match starts.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ClubCurrentMatch;
