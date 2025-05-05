
import React from 'react';
import { Club, Match } from '@/types';
import CurrentMatchCard from './CurrentMatchCard';
import WaitingForMatchCard from './WaitingForMatchCard';
import NeedMoreMembersCard from './NeedMoreMembersCard';
import { isActiveMatchWeek } from '@/utils/date/matchTiming';

interface CurrentMatchesListProps {
  userClubs: Club[];
  onViewProfile: (userId: string, name: string, avatar?: string) => void;
}

const CurrentMatchesList: React.FC<CurrentMatchesListProps> = ({
  userClubs,
  onViewProfile
}) => {
  // Helper function to check if a club has an active match
  const getActiveMatch = (club: Club): Match | null => {
    return club.currentMatch || 
           (club.matchHistory && club.matchHistory.find(m => m.status === 'active')) ||
           null;
  };

  if (!userClubs || userClubs.length === 0) {
    return (
      <div className="text-center p-4 bg-gray-50 rounded-lg">
        <p className="text-gray-500">You haven't joined any clubs yet.</p>
      </div>
    );
  }

  return (
    <div>
      {userClubs.map(club => {
        const activeMatch = getActiveMatch(club);
        const hasEnoughMembers = club.members.length >= 5;
        const isMatchWeek = isActiveMatchWeek();
        
        if (activeMatch) {
          return (
            <CurrentMatchCard 
              key={`${club.id}-match`} 
              match={activeMatch}
              userClub={club}
              onViewProfile={onViewProfile}
            />
          );
        } else if (hasEnoughMembers && !isMatchWeek) {
          return <WaitingForMatchCard key={`${club.id}-waiting`} club={club} />;
        } else if (!hasEnoughMembers) {
          return <NeedMoreMembersCard key={`${club.id}-needs-members`} club={club} />;
        } else {
          // Fallback for clubs with enough members during match week but no match
          return <WaitingForMatchCard key={`${club.id}-waiting`} club={club} />;
        }
      })}
    </div>
  );
};

export default CurrentMatchesList;
