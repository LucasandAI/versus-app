
import { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { Club } from '@/types';
import { hasPendingInvite } from '@/utils/notification-queries';
import { toast } from "@/hooks/use-toast";

export const useClubMembership = (club: Club | null) => {
  const { currentUser, setCurrentView, setCurrentUser, setSelectedClub } = useApp();
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [showLeaveDialog, setShowLeaveDialog] = useState(false);
  const [hasPending, setHasPending] = useState<boolean>(() => {
    // Check if club exists before trying to access its id
    if (!club) return false;
    
    const hasInvite = hasPendingInvite(club.id);
    console.log(`Initial pending invite check for club ${club.id}:`, hasInvite);
    return hasInvite;
  });

  // Guard against null club
  if (!club) {
    return {
      isActuallyMember: false,
      isAdmin: false,
      hasPending: false,
      showInviteDialog,
      setShowInviteDialog,
      showLeaveDialog,
      setShowLeaveDialog,
      setHasPending
    };
  }

  const isActuallyMember = currentUser?.clubs.some(c => c.id === club.id) || false;
  const isAdmin = isActuallyMember && currentUser && club.members.some(member => 
    member.id === currentUser.id && member.isAdmin
  );

  useEffect(() => {
    if (isActuallyMember) {
      console.log('User is already a member, skipping invite check');
      return;
    }
    
    const checkPendingInvite = () => {
      // Only check if club exists
      if (!club) return;
      
      const pending = hasPendingInvite(club.id);
      if (pending || hasPending !== pending) {
        setHasPending(pending);
      }
    };
    
    checkPendingInvite();
    
    const handleNotificationUpdate = () => {
      checkPendingInvite();
    };
    
    window.addEventListener('notificationsUpdated', handleNotificationUpdate);
    
    return () => {
      window.removeEventListener('notificationsUpdated', handleNotificationUpdate);
    };
  }, [club?.id, isActuallyMember, hasPending]);

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
