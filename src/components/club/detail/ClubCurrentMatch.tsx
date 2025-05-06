
import React from 'react';
import { Match } from '@/types';
import { Card, CardContent } from "@/components/ui/card";
import { useApp } from '@/context/AppContext';
import SearchOpponentButton from '@/components/match/SearchOpponentButton';
import NeedMoreMembersCard from '@/components/match/NeedMoreMembersCard';
import CurrentMatchCard from '@/components/match/CurrentMatchCard';

interface ClubCurrentMatchProps {
  match?: Match;
  onViewProfile: (userId: string, name: string, avatar?: string) => void;
  forceShowDetails?: boolean;
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
  
  // We have a match, use CurrentMatchCard which uses the shared MatchDisplay component
  if (match && selectedClub) {
    console.log('[ClubCurrentMatch] Rendering match with club data:', {
      matchId: match.id,
      clubId: selectedClub.id,
      forceShowDetails
    });
    
    return (
      <CurrentMatchCard
        match={match} 
        userClub={selectedClub} 
        onViewProfile={onViewProfile} 
        forceShowDetails={forceShowDetails}
      />
    );
  }
  
  // Fallback case - should not reach here
  return (
    <Card className="shadow-sm">
      <CardContent className="p-4">
        <div className="text-center py-4 text-gray-500">
          Unable to render match information
        </div>
      </CardContent>
    </Card>
  );
};

export default ClubCurrentMatch;
