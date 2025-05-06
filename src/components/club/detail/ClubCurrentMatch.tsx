
import React from 'react';
import { Club, Match } from '@/types';
import { useApp } from '@/context/AppContext';
import { useClubMatchInfo } from '@/hooks/match/useClubMatchInfo';
import CurrentMatchCard from '@/components/match/CurrentMatchCard';
import WaitingForMatchCard from '@/components/match/WaitingForMatchCard';
import NeedMoreMembersCard from '@/components/match/NeedMoreMembersCard';
import { Card, CardContent } from "@/components/ui/card";

interface ClubCurrentMatchProps {
  onViewProfile: (userId: string, name: string, avatar?: string) => void;
}

const ClubCurrentMatch: React.FC<ClubCurrentMatchProps> = ({
  onViewProfile
}) => {
  const { selectedClub } = useApp();
  const clubId = selectedClub?.id;
  
  // Use the custom hook to fetch match data
  const { match, isLoading } = useClubMatchInfo(clubId);

  // If club data isn't available yet
  if (!selectedClub) {
    return (
      <Card className="shadow-sm">
        <CardContent className="p-4">
          <div className="h-40 bg-gray-100 animate-pulse rounded-md"></div>
        </CardContent>
      </Card>
    );
  }

  // Show loading state
  if (isLoading) {
    return (
      <Card className="shadow-sm">
        <CardContent className="p-4">
          <div className="h-40 bg-gray-100 animate-pulse rounded-md"></div>
        </CardContent>
      </Card>
    );
  }

  // If there's an active match for this club
  if (match) {
    return (
      <CurrentMatchCard 
        match={match}
        userClub={selectedClub}
        onViewProfile={onViewProfile}
      />
    );
  }

  // If the club has enough members but no active match
  if (selectedClub.members && selectedClub.members.length >= 5) {
    return <WaitingForMatchCard club={selectedClub} />;
  }

  // If the club doesn't have enough members
  return <NeedMoreMembersCard club={selectedClub} hideHeader={true} />;
};

export default ClubCurrentMatch;
