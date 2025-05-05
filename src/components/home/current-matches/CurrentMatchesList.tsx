
import React from 'react';
import { Club } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';
import CurrentMatchCard from './CurrentMatchCard';
import InsufficientMembersCard from './InsufficientMembersCard';
import AwaitingMatchCard from './AwaitingMatchCard';
import Button from '@/components/shared/Button';

interface CurrentMatchesListProps {
  userClubs: Club[];
  loading?: boolean;
  onSelectUser: (userId: string, name: string, avatar?: string) => void;
  onCreateClub: () => void;
}

const CurrentMatchesList: React.FC<CurrentMatchesListProps> = ({
  userClubs,
  loading = false,
  onSelectUser,
  onCreateClub,
}) => {
  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-40 w-full rounded-lg" />
        <Skeleton className="h-40 w-full rounded-lg" />
      </div>
    );
  }
  
  // Ensure clubs are fully loaded with all required data
  const validClubs = userClubs.filter(club => 
    club && club.name && club.members && Array.isArray(club.members)
  );
  
  if (validClubs.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 text-center">
        <h3 className="font-medium mb-2">No clubs yet</h3>
        <p className="text-gray-500 text-sm mb-4">
          Create or join a club to start competing
        </p>
        <Button 
          variant="primary" 
          size="sm"
          onClick={onCreateClub}
        >
          Create Club
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {validClubs.map((club) => {
        // Check if club has at least 5 members
        const hasSufficientMembers = club.members.length >= 5;
        
        // Check if club has an active match
        const hasActiveMatch = club.currentMatch && club.currentMatch.status === 'active';
        
        if (!hasSufficientMembers) {
          return (
            <InsufficientMembersCard 
              key={club.id}
              club={club}
              onSelectUser={onSelectUser}
            />
          );
        }
        
        if (hasSufficientMembers && hasActiveMatch) {
          return (
            <CurrentMatchCard 
              key={club.id}
              club={club}
              match={club.currentMatch!}
              onSelectUser={onSelectUser}
            />
          );
        }
        
        // Club has sufficient members but no active match
        return (
          <AwaitingMatchCard 
            key={club.id}
            club={club}
            onSelectUser={onSelectUser}
          />
        );
      })}
    </div>
  );
};

export default CurrentMatchesList;
