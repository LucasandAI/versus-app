
import React, { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Match, Club } from '@/types';
import { ChevronDown, Clock } from 'lucide-react';
import MatchProgressBar from '@/components/shared/MatchProgressBar';
import { Button } from '@/components/ui/button';
import { useNavigation } from '@/hooks/useNavigation';
import UserAvatar from '@/components/shared/UserAvatar';
import { formatLeague } from '@/utils/club/leagueUtils';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import CountdownTimer from '@/components/match/CountdownTimer';

interface CurrentMatchCardProps {
  match: Match;
  userClub: Club;
  onViewProfile: (userId: string, name: string, avatar?: string) => void;
}

const CurrentMatchCard: React.FC<CurrentMatchCardProps> = ({
  match,
  userClub,
  onViewProfile
}) => {
  const [showMemberContributions, setShowMemberContributions] = useState(false);
  const { navigateToClubDetail } = useNavigation();

  // Determine if user club is home or away
  const isHome = match.homeClub.id === userClub.id;
  const userClubMatch = isHome ? match.homeClub : match.awayClub;
  const opponentClubMatch = isHome ? match.awayClub : match.homeClub;

  const handleMemberClick = (member: any) => {
    onViewProfile(member.id, member.name, member.avatar);
  };

  const handleClubClick = (clubId: string, clubData: any) => {
    navigateToClubDetail(clubId, clubData);
  };

  const handleCountdownComplete = () => {
    console.log('[CurrentMatchCard] Match ended, refreshing data');
    window.dispatchEvent(new CustomEvent('matchEnded', {
      detail: {
        matchId: match.id
      }
    }));
  };

  // Make sure the endDate is a valid Date object
  const endDate = new Date(match.endDate);

  return (
    <Card className="overflow-hidden border-0 shadow-md">
      <CardContent className="p-4">
        {/* Match in Progress Notification */}
        <div className="p-3 rounded-md mb-4 bg-inherit">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold">Match in progress</h3>
            <div className="flex items-center text-amber-800 text-sm">
              <Clock className="h-4 w-4 mr-1" />
              <span>Time remaining: </span>
              <CountdownTimer
                targetDate={endDate}
                className="font-mono ml-1"
                onComplete={handleCountdownComplete}
                refreshInterval={500}
              />
            </div>
          </div>
        </div>
              
        {/* Clubs Matchup */}
        <div className="flex justify-between items-center mb-6">
          {/* User Club (always on left) */}
          <div className="text-center">
            <div className="flex flex-col items-center cursor-pointer" onClick={() => handleClubClick(userClubMatch.id, userClubMatch)}>
              <UserAvatar name={userClubMatch.name} image={userClubMatch.logo} size="md" className="mb-2" />
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
            <div className="flex flex-col items-center cursor-pointer" onClick={() => handleClubClick(opponentClubMatch.id, opponentClubMatch)}>
              <UserAvatar name={opponentClubMatch.name} image={opponentClubMatch.logo} size="md" className="mb-2" />
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
                          <UserAvatar name={member.name} image={member.avatar} size="sm" />
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
                          <UserAvatar name={member.name} image={member.avatar} size="sm" />
                          <span className="text-sm hover:text-primary transition-colors">{member.name}</span>
                        </div>
                        <span className="text-sm font-medium">{member.distanceContribution?.toFixed(1) || "0.0"} km</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  );
};

export default CurrentMatchCard;
