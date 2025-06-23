
import React, { useState, useEffect } from 'react';
import { Club } from '@/types';
import FindClubsSection from './FindClubsSection';
import { useApp } from '@/context/AppContext';
import CurrentMatchesList from '../match/CurrentMatchesList';

interface HomeClubsSectionProps {
  userClubs: Club[];
  availableClubs: any[];
  clubsLoading?: boolean;
  onSelectClub: (club: Club) => void;
  onSelectUser: (userId: string, name: string, avatar?: string) => void;
  onCreateClub: () => void;
  onRequestJoin: (clubId: string, clubName: string) => void;
  onSearchClick: () => void;
}

const HomeClubsSection: React.FC<HomeClubsSectionProps> = ({
  userClubs,
  availableClubs,
  clubsLoading = false,
  onSelectClub,
  onSelectUser,
  onCreateClub,
  onRequestJoin,
  onSearchClick
}) => {
  const { currentUser } = useApp();
  const [isLoading, setIsLoading] = useState(true);
  
  // Immediate loading state management - no delays
  useEffect(() => {
    if (currentUser && !clubsLoading) {
      // Set loading to false immediately when we have user data
      setIsLoading(false);
    }
  }, [currentUser, clubsLoading]);

  // Process clubs to ensure they have the necessary properties
  const processedUserClubs = (userClubs || [])
    .filter(club => club && club.name)
    .map(club => ({
      ...club,
      members: club.members || []
    }));

  const isAtClubCapacity = processedUserClubs.length >= 3;

  return (
    <>
      <h2 className="text-xl font-bold mt-6 mb-4">Current Matches</h2>
      
      <CurrentMatchesList 
        userClubs={processedUserClubs}
        onViewProfile={onSelectUser}
      />

      {!isAtClubCapacity && !isLoading && (
        <FindClubsSection 
          clubs={availableClubs}
          isLoading={clubsLoading}
          onRequestJoin={onRequestJoin}
          onSearchClick={onSearchClick}
          onCreateClick={onCreateClub}
        />
      )}

      {isAtClubCapacity && !isLoading && (
        <div className="mt-10 bg-white rounded-lg shadow-md p-6 text-center">
          <h3 className="font-medium mb-2">Club Limit Reached</h3>
          <p className="text-gray-500 text-sm mb-4">
            You have reached the maximum of 3 clubs.
          </p>
        </div>
      )}
    </>
  );
};

export default HomeClubsSection;
