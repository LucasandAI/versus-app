
import React from 'react';
import { Club } from '@/types';
import ClubCard from '../club/ClubCard';
import Button from '../shared/Button';

interface ClubListProps {
  userClubs: Club[];
  onSelectUser: (userId: string, name: string, avatar?: string) => void;
  onCreateClub: () => void;
}

const ClubList: React.FC<ClubListProps> = ({
  userClubs,
  onSelectUser,
  onCreateClub,
}) => {
  if (userClubs.length === 0) {
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
      {userClubs.map((club) => (
        <ClubCard
          key={club.id}
          club={club}
          onSelectUser={onSelectUser}
        />
      ))}
    </div>
  );
};

export default ClubList;
