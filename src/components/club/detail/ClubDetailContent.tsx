
import React from 'react';
import { useApp } from '@/context/AppContext';
import { Club } from '@/types';
import { useClubJoin } from '@/hooks/home/useClubJoin';
import ClubHeader from './ClubHeader';
import ClubDetailTabs from './ClubDetailTabs';
import ClubLeaveDialog from './dialogs/ClubLeaveDialog';
import InviteUserDialog from '../InviteUserDialog';
import { useClubMembership } from '@/hooks/club/useClubMembership';
import { useClubActions } from '@/hooks/club/useClubActions';

interface ClubDetailContentProps {
  club: Club | null;
}

const ClubDetailContent: React.FC<ClubDetailContentProps> = ({ club }) => {
  const { currentUser, setCurrentView } = useApp();
  const { handleRequestToJoin } = useClubJoin();
  
  // If club is null, show loading or error state
  if (!club) {
    return (
      <div className="container-mobile py-8 text-center">
        <p className="text-lg text-gray-600">Loading club details...</p>
      </div>
    );
  }
  
  const {
    isActuallyMember,
    isAdmin,
    hasPending,
    showInviteDialog,
    setShowInviteDialog,
    showLeaveDialog,
    setShowLeaveDialog,
    setHasPending
  } = useClubMembership(club);

  const {
    handleLeaveClub,
    handleJoinFromInvite,
    handleDeclineInvite
  } = useClubActions(club);

  const handleRequestToJoinClub = () => {
    handleRequestToJoin(club.id, club.name);
  };

  return (
    <div className="pb-20 relative">
      <ClubHeader 
        club={club}
        isActuallyMember={isActuallyMember}
        isAdmin={isAdmin}
        onBack={() => setCurrentView('home')}
        onInvite={() => setShowInviteDialog(true)}
        onRequestJoin={handleRequestToJoinClub}
        onLeaveClub={() => setShowLeaveDialog(true)}
        onJoinClub={handleJoinFromInvite}
        onDeclineInvite={handleDeclineInvite}
        hasPendingInvite={hasPending}
      />

      <div className="container-mobile pt-4">
        <ClubDetailTabs 
          club={club}
          isActuallyMember={isActuallyMember}
          currentUser={currentUser}
        />
      </div>

      <ClubLeaveDialog
        open={showLeaveDialog}
        onOpenChange={setShowLeaveDialog}
        clubName={club.name}
        onConfirm={handleLeaveClub}
        isAdmin={isAdmin}
        members={club.members}
        currentUserId={currentUser?.id || ''}
      />

      {club && (
        <InviteUserDialog
          open={showInviteDialog}
          onOpenChange={setShowInviteDialog}
          clubId={club.id}
        />
      )}
    </div>
  );
};

export default ClubDetailContent;
