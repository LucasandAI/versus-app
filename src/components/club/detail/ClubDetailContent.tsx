
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
  club: Club;
}

const ClubDetailContent: React.FC<ClubDetailContentProps> = ({ club }) => {
  // Ensure club has members even if undefined
  const safeClub = {
    ...club,
    members: club.members || [],
    matchHistory: club.matchHistory || []
  };

  const { currentUser, setCurrentView } = useApp();
  const { handleRequestToJoin } = useClubJoin();
  
  const {
    isActuallyMember,
    isAdmin,
    hasPending,
    showInviteDialog,
    setShowInviteDialog,
    showLeaveDialog,
    setShowLeaveDialog,
    setHasPending
  } = useClubMembership(safeClub);

  const {
    handleLeaveClub,
    handleJoinFromInvite,
    handleDeclineInvite
  } = useClubActions(safeClub);

  const handleRequestToJoinClub = () => {
    handleRequestToJoin(safeClub.id, safeClub.name);
  };

  return (
    <div className="pb-20 relative">
      <ClubHeader 
        club={safeClub}
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
          club={safeClub}
          isActuallyMember={isActuallyMember}
          currentUser={currentUser}
        />
      </div>

      <ClubLeaveDialog
        open={showLeaveDialog}
        onOpenChange={setShowLeaveDialog}
        clubName={safeClub.name}
        onConfirm={handleLeaveClub}
        isAdmin={isAdmin}
        members={safeClub.members}
        currentUserId={currentUser?.id || ''}
      />

      {safeClub && (
        <InviteUserDialog
          open={showInviteDialog}
          onOpenChange={setShowInviteDialog}
          clubId={safeClub.id}
        />
      )}
    </div>
  );
};

export default ClubDetailContent;
