
import { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { Club } from '@/types';
import { hasPendingInvite } from '@/utils/notification-queries';
import { toast } from "@/hooks/use-toast";

export const useClubMembership = (club: Club) => {
  const { currentUser, setCurrentView, setCurrentUser, setSelectedClub } = useApp();
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [showLeaveDialog, setShowLeaveDialog] = useState(false);
  const [hasPending, setHasPending] = useState<boolean>(false);

  const isActuallyMember = currentUser?.clubs.some(c => c.id === club.id) || false;
  const isAdmin = isActuallyMember && currentUser && club.members.some(member => 
    member.id === currentUser.id && member.isAdmin
  );

  useEffect(() => {
    if (isActuallyMember) {
      console.log('User is already a member, skipping invite check');
      return;
    }
    
    const checkPendingInvite = async () => {
      try {
        const pending = await hasPendingInvite(club.id);
        if (pending || hasPending !== pending) {
          setHasPending(pending);
        }
      } catch (error) {
        console.error('Error checking pending invite:', error);
      }
    };
    
    // Initial check
    checkPendingInvite();
    
    const handleNotificationUpdate = () => {
      checkPendingInvite();
    };
    
    window.addEventListener('notificationsUpdated', handleNotificationUpdate);
    
    return () => {
      window.removeEventListener('notificationsUpdated', handleNotificationUpdate);
    };
  }, [club.id, isActuallyMember, hasPending]);

  return {
    isActuallyMember,
    isAdmin,
    hasPending,
    showInviteDialog,
    setShowInviteDialog,
    showLeaveDialog,
    setShowLeaveDialog,
    setHasPending
  };
};
