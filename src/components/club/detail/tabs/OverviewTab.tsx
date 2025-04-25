
import React from 'react';
import { Club, User } from '@/types';
import ClubStats from '../ClubStats';
import ClubCurrentMatch from '../ClubCurrentMatch';
import ClubAdminActions from '@/components/admin/ClubAdminActions';

interface OverviewTabProps {
  club: Club;
  currentUser: User | null;
  onSelectUser: (userId: string, name: string, avatar?: string) => void;
}

const OverviewTab: React.FC<OverviewTabProps> = ({ 
  club, 
  currentUser,
  onSelectUser 
}) => {
  // Ensure members is always an array, even if undefined
  const members = club.members || [];
  const isAdmin = currentUser && members.some(member => 
    member.id === currentUser.id && member.isAdmin
  );

  return (
    <div className="space-y-6">
      <ClubStats 
        club={club} 
        matchHistory={club.matchHistory || []} 
      />
      {club.currentMatch && (
        <ClubCurrentMatch
          match={club.currentMatch}
          onViewProfile={onSelectUser}
        />
      )}
      {isAdmin && <ClubAdminActions club={club} currentUser={currentUser} />}
    </div>
  );
};

export default OverviewTab;
