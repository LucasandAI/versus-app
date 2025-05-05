
import React, { useState } from 'react';
import { Club } from '@/types';
import { PlusCircle } from 'lucide-react';
import UserAvatar from '../shared/UserAvatar';
import Button from '../shared/Button';
import { Card } from '../ui/card';
import CurrentMatchCard from './CurrentMatchCard';
import { useCurrentMatchCycle } from '@/hooks/home/useCurrentMatchCycle';

interface CurrentMatchesListProps {
  userClubs: Club[];
  loading: boolean;
  onSelectUser: (userId: string, name: string, avatar?: string) => void;
  onSelectClub: (club: Club) => void;
  onCreateClub: () => void;
}

const CurrentMatchesList: React.FC<CurrentMatchesListProps> = ({ 
  userClubs, 
  loading, 
  onSelectUser,
  onSelectClub,
  onCreateClub 
}) => {
  const { timeUntilNextCycle, formatCountdown } = useCurrentMatchCycle();

  // Loading skeleton
  if (loading) {
    return (
      <div className="space-y-4 mt-2">
        <div className="h-5 w-32 bg-gray-200 rounded animate-pulse mb-4"></div>
        {[1, 2].map((i) => (
          <div key={i} className="bg-white rounded-lg shadow-md p-4">
            <div className="flex items-center space-x-3 mb-3">
              <div className="h-12 w-12 rounded-full bg-gray-200 animate-pulse"></div>
              <div>
                <div className="h-4 w-24 bg-gray-200 rounded animate-pulse mb-2"></div>
                <div className="h-3 w-16 bg-gray-200 rounded animate-pulse"></div>
              </div>
            </div>
            <div className="h-24 bg-gray-100 rounded animate-pulse"></div>
          </div>
        ))}
      </div>
    );
  }

  // Empty state
  if (userClubs.length === 0) {
    return (
      <div className="mt-8 text-center">
        <h2 className="text-xl font-bold mb-6">Current Matches</h2>
        <Card className="p-8 flex flex-col items-center justify-center">
          <h3 className="font-medium text-lg mb-2">No clubs yet</h3>
          <p className="text-gray-500 mb-6 max-w-md">
            Join or create a club to start competing in the league and see your matches here.
          </p>
          <Button 
            onClick={onCreateClub}
            className="flex items-center gap-2"
            size="md"
          >
            <PlusCircle className="h-4 w-4" />
            Create Club
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="mt-2">
      <h2 className="text-xl font-bold mb-4">Current Matches</h2>
      <div className="space-y-6">
        {userClubs.map((club) => (
          <CurrentMatchCard 
            key={club.id} 
            club={club}
            onSelectUser={onSelectUser}
            onSelectClub={onSelectClub}
            timeUntilNextCycle={timeUntilNextCycle}
            formatCountdown={formatCountdown}
          />
        ))}
        
        {userClubs.length < 3 && (
          <Button 
            variant="outline"
            className="flex items-center justify-center gap-2 w-full mt-4 border-dashed border-2 py-6 text-gray-500"
            onClick={onCreateClub}
          >
            <PlusCircle className="h-5 w-5" />
            Create New Club
          </Button>
        )}
      </div>
    </div>
  );
};

export default CurrentMatchesList;
