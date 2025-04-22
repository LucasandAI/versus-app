
import React, { useState, useEffect } from 'react';
import { Club } from '@/types';
import ClubList from './ClubList';
import FindClubsSection from './FindClubsSection';
import { useApp } from '@/context/AppContext';

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
  const [isLoading, setIsLoading] = useState(false);
  
  // Track loading state based on initial render and clubs length
  useEffect(() => {
    // Set loading to true if we have a user but no clubs yet
    if (currentUser && currentUser.clubs && currentUser.clubs.length === 0 && userClubs.length === 0) {
      setIsLoading(true);
      
      // Add a short timeout to prevent flashing loading state for fast loads
      const timer = setTimeout(() => {
        setIsLoading(false);
      }, 2000);
      
      return () => clearTimeout(timer);
    } else {
      setIsLoading(false);
    }
  }, [currentUser, userClubs.length]);
  
  // Make sure clubs have the correct member count displayed
  const processedUserClubs = userClubs.map(club => {
    // Ensure the members array exists
    if (!club.members) {
      club.members = [];
    }
    return club;
  });
  
  const isAtClubCapacity = processedUserClubs.length >= 3;

  return (
    <>
      <ClubList 
        userClubs={processedUserClubs}
        loading={isLoading || clubsLoading}
        onSelectUser={onSelectUser}
        onCreateClub={onCreateClub}
      />

      {!isAtClubCapacity && (
        <FindClubsSection 
          clubs={availableClubs}
          isLoading={clubsLoading}
          onRequestJoin={onRequestJoin}
          onSearchClick={onSearchClick}
          onCreateClick={onCreateClub}
        />
      )}

      {isAtClubCapacity && (
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
