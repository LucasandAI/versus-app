
import React from 'react';
import { Club, Match } from '@/types';
import ClubCurrentMatch from '../club/detail/ClubCurrentMatch';
import WaitingForMatchCard from './WaitingForMatchCard';
import NeedMoreMembersCard from './NeedMoreMembersCard';
import { useMatchInfo } from '@/hooks/match/useMatchInfo';

interface CurrentMatchesListProps {
  userClubs: Club[];
  onViewProfile: (userId: string, name: string, avatar?: string) => void;
}

const CurrentMatchesList: React.FC<CurrentMatchesListProps> = ({
  userClubs,
  onViewProfile
}) => {
  const { matches, isLoading } = useMatchInfo(userClubs);
  
  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="h-40 bg-gray-100 animate-pulse rounded-md"></div>
        ))}
      </div>
    );
  }

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
        if (!club) return null;
        
        // Find the active match for this club
        const activeMatch = matches.find(match => 
          (match.homeClub.id === club.id || match.awayClub.id === club.id) && 
          match.status === 'active'
        );
        
        const hasEnoughMembers = club.members && club.members.length >= 5;
        
        if (activeMatch) {
          return (
            <div key={`${club.id}-match`} className="mb-6 bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="p-4 border-b border-gray-100">
                <h3 className="font-bold text-md">{club.name}</h3>
              </div>
              <ClubCurrentMatch
                match={activeMatch}
                onViewProfile={onViewProfile}
                forceShowDetails={true}  // Force showing the details in homepage view
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
