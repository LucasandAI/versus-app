
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useApp } from '@/context/AppContext';

export const useClubMembershipSync = () => {
  const { currentUser, refreshCurrentUser } = useApp();
  
  useEffect(() => {
    if (!currentUser?.id) return;
    
    console.log('[useClubMembershipSync] Setting up club membership subscription for user:', currentUser.id);
    
    // Subscribe to ALL club_members table changes (not just current user)
    // This ensures User B gets updates when User A accepts them
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
          
          // If this membership change involves the current user, refresh immediately
          if (payload.new?.user_id === currentUser.id) {
            console.log('[useClubMembershipSync] Current user was added to a club, refreshing...');
            if (refreshCurrentUser) {
              refreshCurrentUser().then(() => {
                console.log('[useClubMembershipSync] User data refreshed after being added to club');
              }).catch(err => {
                console.error('[useClubMembershipSync] Error refreshing user data:', err);
              });
            }
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
          
          // If this membership change involves the current user, refresh immediately
          if (payload.old?.user_id === currentUser.id) {
            console.log('[useClubMembershipSync] Current user was removed from a club, refreshing...');
            if (refreshCurrentUser) {
              refreshCurrentUser().then(() => {
                console.log('[useClubMembershipSync] User data refreshed after being removed from club');
              }).catch(err => {
                console.error('[useClubMembershipSync] Error refreshing user data:', err);
              });
            }
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
  
  // Listen for custom events from other parts of the app
  useEffect(() => {
    const handleClubMembershipChange = (event: CustomEvent) => {
      console.log('[useClubMembershipSync] Club membership change event:', event.detail);
      
      // Refresh for any membership change, not just for current user
      if (refreshCurrentUser) {
        refreshCurrentUser().catch(err => {
          console.error('[useClubMembershipSync] Error refreshing user data from custom event:', err);
        });
      }
    };
    
    const handleMembershipAccepted = (event: CustomEvent) => {
      console.log('[useClubMembershipSync] Membership accepted event:', event.detail);
      
      // Refresh user data immediately for ANY membership acceptance
      // This ensures User B gets updates when User A accepts them
      if (refreshCurrentUser) {
        refreshCurrentUser().then(() => {
          console.log('[useClubMembershipSync] User data refreshed after membership acceptance');
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
