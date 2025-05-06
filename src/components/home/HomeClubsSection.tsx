
import React, { useState, useEffect, useMemo } from 'react';
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
  
  // Process clubs to ensure they have the necessary properties
  const processedUserClubs = useMemo(() => userClubs
    .filter(club => club && club.name) // Only include clubs with name
    .map(club => ({
      ...club,
      // Ensure the members array exists
      members: club.members || []
    })), [userClubs]);

  // Memoize club capacity check
  const isAtClubCapacity = useMemo(() => 
    processedUserClubs.length >= 3, 
    [processedUserClubs.length]
  );
  
  // Track loading state based on initial render and clubs data quality
  useEffect(() => {
    // Define what makes a club "fully loaded"
    const areClubsReady = userClubs.every(club => 
      club && 
      club.name && 
      club.logo && 
      club.members && 
      Array.isArray(club.members)
    );
    
    // If we have the user but clubs are loading/incomplete, show loading state
    if (currentUser) {
      if (clubsLoading || !areClubsReady) {
        setIsLoading(true);
      } else {
        // Add a small delay to ensure everything renders correctly
        const timer = setTimeout(() => {
          setIsLoading(false);
        }, 100);
        
        return () => clearTimeout(timer);
      }
    } else {
      setIsLoading(true);
    }
  }, [currentUser, userClubs, clubsLoading]);

  return (
    <>
      <h2 className="text-xl font-bold mt-6 mb-4">Current Matches</h2>
      
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="h-40 bg-gray-100 animate-pulse rounded-md"></div>
          ))}
        </div>
      ) : (
        <CurrentMatchesList 
          userClubs={processedUserClubs}
          onViewProfile={onSelectUser}
        />
      )}

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
