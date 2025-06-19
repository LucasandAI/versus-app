
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useApp } from '@/context/AppContext';

export const useClubMembershipSync = () => {
  const { currentUser, refreshCurrentUser } = useApp();
  
  useEffect(() => {
    if (!currentUser?.id) return;
    
    console.log('[useClubMembershipSync] Setting up club membership subscription for user:', currentUser.id);
    
    // Subscribe to club_members table changes for this user
    const channel = supabase
      .channel('club-membership-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'club_members',
          filter: `user_id=eq.${currentUser.id}`
        },
        (payload) => {
          console.log('[useClubMembershipSync] User added to club:', payload);
          
          // Refresh user data to get updated club list
          if (refreshCurrentUser) {
            refreshCurrentUser().then(() => {
              console.log('[useClubMembershipSync] User data refreshed after club membership change');
            }).catch(err => {
              console.error('[useClubMembershipSync] Error refreshing user data:', err);
            });
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'club_members',
          filter: `user_id=eq.${currentUser.id}`
        },
        (payload) => {
          console.log('[useClubMembershipSync] User removed from club:', payload);
          
          // Refresh user data to get updated club list
          if (refreshCurrentUser) {
            refreshCurrentUser().then(() => {
              console.log('[useClubMembershipSync] User data refreshed after club membership removal');
            }).catch(err => {
              console.error('[useClubMembershipSync] Error refreshing user data:', err);
            });
          }
        }
      )
      .subscribe((status) => {
        console.log('[useClubMembershipSync] Subscription status:', status);
      });
      
    return () => {
      console.log('[useClubMembershipSync] Cleaning up club membership subscription');
      supabase.removeChannel(channel);
    };
  }, [currentUser?.id, refreshCurrentUser]);
  
  // Also listen for custom events from other parts of the app
  useEffect(() => {
    const handleClubMembershipChange = (event: CustomEvent) => {
      console.log('[useClubMembershipSync] Club membership change event:', event.detail);
      
      // Only refresh if this affects the current user
      if (event.detail?.userId === currentUser?.id && refreshCurrentUser) {
        refreshCurrentUser().catch(err => {
          console.error('[useClubMembershipSync] Error refreshing user data from custom event:', err);
        });
      }
    };
    
    window.addEventListener('clubMembershipChanged', handleClubMembershipChange as EventListener);
    
    return () => {
      window.removeEventListener('clubMembershipChanged', handleClubMembershipChange as EventListener);
    };
  }, [currentUser?.id, refreshCurrentUser]);
};
