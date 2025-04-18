
import React from 'react';
import { Club } from '@/types';
import ClubList from './ClubList';
import FindClubsSection from './FindClubsSection';

interface HomeClubsSectionProps {
  userClubs: Club[];
  availableClubs: any[];
  onSelectClub: (club: Club) => void;
  onSelectUser: (userId: string, name: string) => void;
  onCreateClub: () => void;
  onRequestJoin: (clubId: string, clubName: string) => void;
  onSearchClick: () => void;
}

const HomeClubsSection: React.FC<HomeClubsSectionProps> = ({
  userClubs,
  availableClubs,
  onSelectClub,
  onSelectUser,
  onCreateClub,
  onRequestJoin,
  onSearchClick
}) => {
  const isAtClubCapacity = userClubs.length >= 3;

  return (
    <>
      <ClubList 
        userClubs={userClubs}
        onSelectClub={onSelectClub}
        onSelectUser={onSelectUser}
        onCreateClub={onCreateClub}
      />

      {!isAtClubCapacity && (
        <FindClubsSection 
          clubs={availableClubs}
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
