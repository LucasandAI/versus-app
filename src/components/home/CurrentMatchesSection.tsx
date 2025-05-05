
import React, { useEffect, useState } from 'react';
import { Club, Match } from '@/types';
import { isClubEligibleForMatch } from '@/utils/match/matchTimingUtils';
import CurrentMatchCard from '../match/CurrentMatchCard';
import MatchEligibilityCard from '../match/MatchEligibilityCard';
import { Skeleton } from '@/components/ui/skeleton';

interface CurrentMatchesSectionProps {
  userClubs: Club[];
  loading?: boolean;
  onSelectClub: (club: Club) => void;
  onInviteClick?: (club: Club) => void;
}

const CurrentMatchesSection: React.FC<CurrentMatchesSectionProps> = ({
  userClubs,
  loading = false,
  onSelectClub,
  onInviteClick
}) => {
  if (loading) {
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-bold">Current Matches</h2>
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-32 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  if (userClubs.length === 0) {
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-bold">Current Matches</h2>
        <div className="bg-muted rounded-lg p-6 text-center">
          <p className="text-muted-foreground">No clubs yet. Create a club to start competing!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">Current Matches</h2>
      <div className="space-y-3">
        {userClubs.map((club) => {
          const currentMatch = club.currentMatch;
          const isEligible = isClubEligibleForMatch(club);
          
          if (isEligible && currentMatch) {
            return (
              <CurrentMatchCard 
                key={club.id} 
                club={club}
                match={currentMatch}
                onClick={() => onSelectClub(club)}
              />
            );
          } else {
            return (
              <MatchEligibilityCard
                key={club.id}
                club={club}
                onClubClick={() => onSelectClub(club)}
                onInviteClick={() => onInviteClick && onInviteClick(club)}
              />
            );
          }
        })}
      </div>
    </div>
  );
};

export default CurrentMatchesSection;
