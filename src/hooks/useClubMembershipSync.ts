import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useApp } from '@/context/AppContext';

export const useClubMembershipSync = () => {
  const { currentUser, refreshCurrentUser } = useApp();
  
  useEffect(() => {
    if (!currentUser?.id) return;
    
    console.log('[useClubMembershipSync] Setting up club membership subscription for user:', currentUser.id);
    
    // Subscribe to ALL club_members table changes
    // This ensures all users get updates when memberships change in clubs they're part of
    const channel = supabase
      .channel('club-membership-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'club_members'
        },
        (payload) => {
          console.log('[useClubMembershipSync] Club membership added:', payload);
          
          // Always refresh current user data when any membership changes occur
          // This ensures the UI updates for all affected users
          if (refreshCurrentUser) {
            console.log('[useClubMembershipSync] Refreshing user data due to membership change');
            refreshCurrentUser().then(() => {
              console.log('[useClubMembershipSync] User data refreshed after membership change');
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
          table: 'club_members'
        },
        (payload) => {
          console.log('[useClubMembershipSync] Club membership removed:', payload);
          
          // Always refresh current user data when any membership changes occur
          if (refreshCurrentUser) {
            console.log('[useClubMembershipSync] Refreshing user data due to membership removal');
            refreshCurrentUser().then(() => {
              console.log('[useClubMembershipSync] User data refreshed after membership removal');
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
  
  // Keep custom events for same-session optimizations only
  useEffect(() => {
    const handleClubMembershipChange = (event: CustomEvent) => {
      console.log('[useClubMembershipSync] Club membership change event (same session):', event.detail);
      
      // Only refresh for same-session optimizations
      if (refreshCurrentUser) {
        refreshCurrentUser().catch(err => {
          console.error('[useClubMembershipSync] Error refreshing user data from custom event:', err);
        });
      }
    };
    
    const handleMembershipAccepted = (event: CustomEvent) => {
      console.log('[useClubMembershipSync] Membership accepted event (same session):', event.detail);
      
      // Only refresh for same-session optimizations
      if (refreshCurrentUser) {
        refreshCurrentUser().then(() => {
          console.log('[useClubMembershipSync] User data refreshed after membership acceptance (same session)');
        }).catch(err => {
          console.error('[useClubMembershipSync] Error refreshing user data after acceptance:', err);
        });
      }
    };
    
    window.addEventListener('clubMembershipChanged', handleClubMembershipChange as EventListener);
    window.addEventListener('membershipAccepted', handleMembershipAccepted as EventListener);
    
    return () => {
      window.removeEventListener('clubMembershipChanged', handleClubMembershipChange as EventListener);
      window.removeEventListener('membershipAccepted', handleMembershipAccepted as EventListener);
    };
  }, [currentUser?.id, refreshCurrentUser]);
};
