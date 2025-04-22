import React from 'react';
import { Club, User } from '@/types';
import ClubStats from '../ClubStats';
import ClubCurrentMatch from '../ClubCurrentMatch';
import ClubAdminActions from '@/components/admin/ClubAdminActions';

interface OverviewTabProps {
  club: Club;
  currentUser: User | null;
  onSelectUser: (userId: string, userName: string, userAvatar?: string) => void;
  onClubUpdated?: () => void;
}

const OverviewTab: React.FC<OverviewTabProps> = ({ 
  club, 
  currentUser,
  onSelectUser,
  onClubUpdated
}) => {
  const isAdmin = currentUser && club.members.some(member => 
    member.id === currentUser.id && member.isAdmin
  );

  return (
    <div className="space-y-6">
      <ClubStats 
        club={club} 
        matchHistory={club.matchHistory} 
      />
      {club.currentMatch && (
        <ClubCurrentMatch
          match={club.currentMatch}
          onViewProfile={onSelectUser}
        />
      )}
      {isAdmin && (
        <ClubAdminActions 
          club={club} 
          currentUser={currentUser}
          onClubUpdated={onClubUpdated}
        />
      )}
    </div>
  );
};

export default OverviewTab;
