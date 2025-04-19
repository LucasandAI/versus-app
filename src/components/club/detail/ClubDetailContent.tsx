
import React, { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { Club } from '@/types';
import { useClubJoin } from '@/hooks/home/useClubJoin';
import ClubHeader from './ClubHeader';
import ClubDetailTabs from './ClubDetailTabs';
import ClubLeaveDialog from './dialogs/ClubLeaveDialog';
import InviteUserDialog from '../InviteUserDialog';
import { toast } from "@/hooks/use-toast";
import { handleNotification } from '@/utils/notificationUtils';
import { hasPendingInvite } from '@/utils/notification-queries';

interface ClubDetailContentProps {
  club: Club;
}

const ClubDetailContent: React.FC<ClubDetailContentProps> = ({ club }) => {
  const { currentUser, setCurrentView, setCurrentUser, setSelectedClub } = useApp();
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [showLeaveDialog, setShowLeaveDialog] = useState(false);
  const { handleRequestToJoin, handleJoinClub } = useClubJoin();
  
  // Check for pending invites on initial render and store the result
  const [hasPending, setHasPending] = useState<boolean>(() => {
    const hasInvite = hasPendingInvite(club.id);
    console.log(`Initial pending invite check for club ${club.id}:`, hasInvite);
    return hasInvite;
  });

  const isActuallyMember = currentUser?.clubs.some(c => c.id === club.id) || false;
  const isAdmin = isActuallyMember && currentUser && club.members.some(member => 
    member.id === currentUser.id && member.isAdmin
  );
  
  // Re-check for pending invites when notifications change, but only if not a member
  useEffect(() => {
    // Skip checking for invites if user is already a member
    if (isActuallyMember) {
      console.log('User is already a member, skipping invite check');
      return;
    }
    
    const checkPendingInvite = () => {
      const pending = hasPendingInvite(club.id);
      console.log('Has pending invite (DetailContent effect):', pending);
      // Only update state if the invite status has changed or if there is an invite
      // This prevents overriding a detected invite during re-renders
      if (pending || hasPending !== pending) {
        setHasPending(pending);
      }
    };
    
    // Check immediately
    checkPendingInvite();
    
    // Listen for notification updates
    const handleNotificationUpdate = () => {
      checkPendingInvite();
    };
    
    window.addEventListener('notificationsUpdated', handleNotificationUpdate);
    
    return () => {
      window.removeEventListener('notificationsUpdated', handleNotificationUpdate);
    };
  }, [club.id, isActuallyMember, hasPending]);

  const handleRequestToJoinClub = () => {
    handleRequestToJoin(club.id, club.name);
  };

  const handleLeaveClub = (newAdminId?: string) => {
    if (!currentUser || !isActuallyMember) return;
    
    // Update the club members list
    const updatedClub = { ...club };
    if (newAdminId) {
      // Update admin status
      updatedClub.members = club.members.map(member => ({
        ...member,
        isAdmin: member.id === newAdminId
      }));
    }
    
    // Remove current user from the club
    updatedClub.members = updatedClub.members.filter(member => member.id !== currentUser.id);
    
    // Update user's clubs list
    const updatedClubs = currentUser.clubs.filter(c => c.id !== club.id);
    const updatedUser = {
      ...currentUser,
      clubs: updatedClubs
    };

    // Update localStorage clubs
    let allClubs = [];
    try {
      const storedClubs = localStorage.getItem('clubs');
      allClubs = storedClubs ? JSON.parse(storedClubs) : [];
      
      // Update the club in localStorage
      const clubIndex = allClubs.findIndex((c: any) => c.id === club.id);
      if (clubIndex !== -1) {
        allClubs[clubIndex] = updatedClub;
        localStorage.setItem('clubs', JSON.stringify(allClubs));
      }
    } catch (error) {
      console.error('Error updating clubs in localStorage:', error);
    }
    
    // Update currentUser in context and localStorage
    setCurrentUser(updatedUser);
    localStorage.setItem('currentUser', JSON.stringify(updatedUser));
    
    // Clear selected club to prevent stale data
    setSelectedClub(null);
    
    toast({
      title: "Left Club",
      description: `You have successfully left ${club.name}.`
    });
    
    // Redirect to home after leaving
    setCurrentView('home');
    
    // Notify the app about the user data change
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
      
      // Update local state to reflect the invite has been processed
      setHasPending(false);
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
      
      // Update local state to reflect the invite has been declined
      setHasPending(false);
    }
  };

  // Debug logging
  console.log('Club detail render state:', { 
    clubId: club.id, 
    isActuallyMember, 
    hasPending,
    memberCount: club.members.length
  });

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
