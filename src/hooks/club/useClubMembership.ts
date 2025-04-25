
import { useState, useEffect } from 'react';
import { Club } from '@/types';
import { useApp } from '@/context/AppContext';
import { supabase } from '@/integrations/supabase/client';

export const useClubMembership = (club: Club) => {
  const { currentUser } = useApp();
  const [isActuallyMember, setIsActuallyMember] = useState<boolean>(false);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [hasPending, setHasPending] = useState<boolean>(false);
  const [showInviteDialog, setShowInviteDialog] = useState<boolean>(false);
  const [showLeaveDialog, setShowLeaveDialog] = useState<boolean>(false);

  useEffect(() => {
    const checkMembership = async () => {
      if (!currentUser || !club || !club.id) return;
      
      try {
        console.log('[useClubMembership] Checking member status for user:', currentUser.id, 'in club:', club.id);
        
        // Check if user is a member in this club
        const { data: memberData, error: memberError } = await supabase
          .from('club_members')
          .select('is_admin')
          .eq('club_id', club.id)
          .eq('user_id', currentUser.id)
          .single();
          
        if (memberError && memberError.code !== 'PGRST116') {
          console.error('[useClubMembership] Error checking membership:', memberError);
          return;
        }
        
        const isMember = !!memberData;
        console.log('[useClubMembership] User is member:', isMember);
        setIsActuallyMember(isMember);
        
        // Set admin status
        if (isMember && memberData) {
          setIsAdmin(memberData.is_admin);
          console.log('[useClubMembership] User is admin:', memberData.is_admin);
        } else {
          setIsAdmin(false);
        }
        
        // Check if user has pending invitation
        const { data: notificationData, error: notificationError } = await supabase
          .from('notifications')
          .select('*')
          .eq('user_id', currentUser.id)
          .eq('club_id', club.id)
          .eq('type', 'invitation')
          .eq('status', 'pending')
          .single();
          
        if (notificationError && notificationError.code !== 'PGRST116') {
          console.error('[useClubMembership] Error checking invitations:', notificationError);
        }
        
        const hasPendingInvite = !!notificationData;
        console.log('[useClubMembership] Has pending invite:', hasPendingInvite);
        setHasPending(hasPendingInvite);
      } catch (error) {
        console.error('[useClubMembership] Error checking membership status:', error);
      }
    };

    checkMembership();
  }, [currentUser, club]);

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
