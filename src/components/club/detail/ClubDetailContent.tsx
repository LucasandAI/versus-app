
import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Club } from '@/types';
import { useClubJoin } from '@/hooks/home/useClubJoin';
import ClubHeader from './ClubHeader';
import ClubDetailTabs from './ClubDetailTabs';
import ClubLeaveDialog from './dialogs/ClubLeaveDialog';
import InviteUserDialog from '../InviteUserDialog';
import { toast } from "@/hooks/use-toast";
import { handleNotification, hasPendingInvite } from '@/utils/notificationUtils';

interface ClubDetailContentProps {
  club: Club;
}

const ClubDetailContent: React.FC<ClubDetailContentProps> = ({ club }) => {
  const { currentUser, setCurrentView } = useApp();
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [showLeaveDialog, setShowLeaveDialog] = useState(false);
  const { handleRequestToJoin, handleJoinClub } = useClubJoin();

  const isActuallyMember = currentUser?.clubs.some(c => c.id === club.id) || false;
  const isAdmin = isActuallyMember && currentUser && club.members.some(member => 
    member.id === currentUser.id && member.isAdmin
  );
  
  // Check if there's a pending invite
  console.log('Club ID in DetailContent:', club.id); 
  const hasPending = hasPendingInvite(club.id);
  console.log('Has pending invite (DetailContent):', hasPending);

  const handleRequestToJoinClub = () => {
    handleRequestToJoin(club.id, club.name);
  };

  const handleLeaveClub = () => {
    if (!currentUser || !isActuallyMember) return;
    
    const updatedClubs = currentUser.clubs.filter(c => c.id !== club.id);
    const updatedUser = {
      ...currentUser,
      clubs: updatedClubs
    };
    
    localStorage.setItem('currentUser', JSON.stringify(updatedUser));
    
    toast({
      title: "Left Club",
      description: `You have successfully left ${club.name}.`,
    });
    setCurrentView('home');
    
    window.dispatchEvent(new CustomEvent('userDataUpdated'));
  };

  const handleJoinFromInvite = () => {
    if (!club || !currentUser) return;
    
    const notifications = JSON.parse(localStorage.getItem('notifications') || '[]');
    const invitation = notifications.find(
      (n: any) => n.type === 'invitation' && n.clubId === club.id
    );
    
    if (invitation) {
      handleNotification(invitation.id, 'delete');
      handleJoinClub(club.id, club.name);
    }
  };

  const handleDeclineInvite = () => {
    if (!club) return;
    
    const notifications = JSON.parse(localStorage.getItem('notifications') || '[]');
    const invitation = notifications.find(
      (n: any) => n.type === 'invitation' && n.clubId === club.id
    );
    
    if (invitation) {
      handleNotification(invitation.id, 'delete');
      toast({
        title: "Invite Declined",
        description: `You have declined the invitation to join ${club.name}.`
      });
    }
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
