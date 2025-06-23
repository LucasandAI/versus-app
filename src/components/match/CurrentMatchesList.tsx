
import React, { useState, useEffect } from 'react';
import { Club, Match } from '@/types';
import CurrentMatchCard from './CurrentMatchCard';
import WaitingForMatchCard from './WaitingForMatchCard';
import NeedMoreMembersCard from './NeedMoreMembersCard';
import { useMatchInfo } from '@/hooks/match/useMatchInfo';
import { Skeleton } from "@/components/ui/skeleton";

interface CurrentMatchesListProps {
  userClubs: Club[];
  onViewProfile: (userId: string, name: string, avatar?: string) => void;
}

const CurrentMatchesList: React.FC<CurrentMatchesListProps> = ({
  userClubs,
  onViewProfile
}) => {
  const { matches, isLoading } = useMatchInfo(userClubs);
  const [showingSkeleton, setShowingSkeleton] = useState(true);
  
  // Optimized loading state - show content faster
  useEffect(() => {
    if (!isLoading || matches.length > 0) {
      // Hide skeleton immediately when we have data or loading is complete
      setShowingSkeleton(false);
    }
  }, [isLoading, matches.length]);

  if (!userClubs || userClubs.length === 0) {
    return (
      <div className="text-center p-4 bg-gray-50 rounded-lg">
        <p className="text-gray-500">You haven't joined any clubs yet.</p>
      </div>
    );
  }

  // Show skeleton only briefly while waiting for initial data
  if (showingSkeleton && matches.length === 0) {
    return (
      <div className="space-y-3">
        {userClubs.slice(0, 3).map((club, i) => (
          <div key={`skeleton-${club.id || i}`} className="bg-white rounded-lg shadow-md p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-3">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
              <div className="text-right space-y-2">
                <Skeleton className="h-4 w-20 ml-auto" />
                <Skeleton className="h-3 w-16 ml-auto" />
              </div>
            </div>
            <Skeleton className="h-2 w-full" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div>
      {userClubs.map(club => {
        if (!club) return null;
        
        // Find the active match for this club
        const activeMatch = matches.find(match => 
          (match.homeClub.id === club.id || match.awayClub.id === club.id) && 
          match.status === 'active'
        );
        
        const hasEnoughMembers = club.members && club.members.length >= 5;
        
        if (activeMatch) {
          return (
            <div key={`${club.id}-match`} className="mb-6">
              <CurrentMatchCard
                match={activeMatch}
                userClub={club}
                onViewProfile={onViewProfile}
              />
            </div>
          );
        } else if (hasEnoughMembers) {
          return <WaitingForMatchCard key={`${club.id}-waiting`} club={club} />;
        } else {
          return <NeedMoreMembersCard key={`${club.id}-needs-members`} club={club} />;
        }
      })}
    </div>
  );
};

export default CurrentMatchesList;
