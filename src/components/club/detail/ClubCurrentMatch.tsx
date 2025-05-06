
import React, { useState } from 'react';
import { Club } from '@/types';
import { useApp } from '@/context/AppContext';
import { useClubMatchInfo } from '@/hooks/match/useClubMatchInfo';
import CurrentMatchCard from '@/components/match/CurrentMatchCard';
import WaitingForMatchCard from '@/components/match/WaitingForMatchCard';
import NeedMoreMembersCard from '@/components/match/NeedMoreMembersCard';
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface ClubCurrentMatchProps {
  onViewProfile: (userId: string, name: string, avatar?: string) => void;
}

const ClubCurrentMatch: React.FC<ClubCurrentMatchProps> = ({
  onViewProfile
}) => {
  const { selectedClub } = useApp();
  const clubId = selectedClub?.id;
  const [isLoadingFinished, setIsLoadingFinished] = useState(false);
  
  // Use the custom hook to fetch match data
  const { match, isLoading } = useClubMatchInfo(clubId);

  // Set a timeout to mark loading as finished to avoid UI flicker
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoadingFinished(true);
    }, 1000); // Wait 1 second before showing content to avoid flashing

    return () => clearTimeout(timer);
  }, []);

  // If club data isn't available yet
  if (!selectedClub) {
    return <LoadingSkeleton />;
  }

  // Show loading state, but with a minimum duration to prevent flashing
  if (isLoading || !isLoadingFinished) {
    return <LoadingSkeleton />;
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

// Loading skeleton with consistent styling
const LoadingSkeleton = () => (
  <Card className="overflow-hidden border-0 shadow-md mb-4">
    <CardContent className="p-4">
      <div className="space-y-4">
        <Skeleton className="h-10 w-full mb-2" />
        <div className="flex justify-between items-center space-x-4 mb-6">
          <div className="flex flex-col items-center space-y-2">
            <Skeleton className="h-16 w-16 rounded-full" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-3 w-12" />
          </div>
          <Skeleton className="h-6 w-6" />
          <div className="flex flex-col items-center space-y-2">
            <Skeleton className="h-16 w-16 rounded-full" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-3 w-12" />
          </div>
        </div>
        <Skeleton className="h-5 w-full" />
        <Skeleton className="h-8 w-full mt-4" />
      </div>
    </CardContent>
  </Card>
);

export default ClubCurrentMatch;
