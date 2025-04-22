
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
  const [isCheckingInvite, setIsCheckingInvite] = useState(false);

  // Safely check if user is a member
  const isActuallyMember = currentUser?.clubs?.some(c => c.id === club.id) || false;
  
  // Safely check if user is an admin
  const isAdmin = isActuallyMember && currentUser && 
    club.members?.some(member => member.id === currentUser.id && member.isAdmin);

  useEffect(() => {
    if (!club?.id) {
      console.log('Club ID is missing, skipping invite check');
      return;
    }
    
    if (isActuallyMember) {
      console.log('User is already a member, skipping invite check');
      return;
    }
    
    const checkPendingInvite = async () => {
      try {
        setIsCheckingInvite(true);
        console.log('Checking for pending invite for club:', club.id);
        const pending = await hasPendingInvite(club.id);
        console.log('Pending invite status:', pending);
        setHasPending(pending);
      } catch (error) {
        console.error('Error checking pending invite:', error);
        // Don't update hasPending state on error to avoid UI flickering
      } finally {
        setIsCheckingInvite(false);
      }
    };
    
    // Initial check
    checkPendingInvite();
    
    const handleNotificationUpdate = () => {
      if (!isCheckingInvite) {
        checkPendingInvite();
      }
    };
    
    window.addEventListener('notificationsUpdated', handleNotificationUpdate);
    
    return () => {
      window.removeEventListener('notificationsUpdated', handleNotificationUpdate);
    };
  }, [club?.id, isActuallyMember, isCheckingInvite]);

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
