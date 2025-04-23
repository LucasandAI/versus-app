import { useEffect } from 'react';
import { safeSupabase } from '@/integrations/supabase/safeClient';
import { AppView, User } from '@/types';
import { useLoadCurrentUser } from './useLoadCurrentUser';
import { toast } from '@/hooks/use-toast';

// Timeout for authentication check (10 seconds)
export const AUTH_TIMEOUT = 10000;

interface AuthSessionCoreProps {
  setCurrentUser: React.Dispatch<React.SetStateAction<User | null>>;
  setCurrentView: React.Dispatch<React.SetStateAction<AppView>>;
  setUserLoading: (loading: boolean) => void;
  setAuthChecked: (checked: boolean) => void;
  setAuthError: (error: string | null) => void;
}

export const useAuthSessionCore = ({
  setCurrentUser,
  setCurrentView,
  setUserLoading,
  setAuthChecked,
  setAuthError,
}: AuthSessionCoreProps) => {
  const { loadCurrentUser } = useLoadCurrentUser();

  useEffect(() => {
    let isMounted = true;
    let authTimeoutId: ReturnType<typeof setTimeout>;
    
    console.log('[useAuthSessionCore] Setting up auth session listener');

    const { data } = safeSupabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted) return;
      
      console.log('[useAuthSessionCore] Auth state changed:', { 
        event, 
        userId: session?.user?.id,
        userEmail: session?.user?.email
      });

      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        if (session?.user?.id) {
          try {
            if (event === 'SIGNED_IN') {
              setUserLoading(true);
            }
            
            // Set immediate basic user state with session data
            const basicUser: User = {
              id: session.user.id,
              name: session.user.email || 'User',
              avatar: '/placeholder.svg',
              bio: '',
              clubs: []
            };
            
            setCurrentUser(basicUser);
            setCurrentView('home');
            
            // Load full profile in background
            const userProfile = await loadCurrentUser(session.user.id);
            if (isMounted && userProfile) {
              console.log('[useAuthSessionCore] Setting full user profile:', userProfile.id);
              setCurrentUser(userProfile);
            }
          } catch (error) {
            console.error('[useAuthSessionCore] Error in auth flow:', error);
            if (isMounted) {
              setAuthError(error instanceof Error ? error.message : 'Authentication error');
            }
          } finally {
            if (isMounted) {
              setUserLoading(false);
              setAuthChecked(true);
            }
          }
        }
      } else if (event === 'SIGNED_OUT') {
        console.log('[useAuthSessionCore] User signed out');
        if (isMounted) {
          setCurrentUser(null);
          setCurrentView('connect');
          setAuthChecked(true);
          setUserLoading(false);
        }
      }
    });

    // Then, check for an existing session, but don't show loading screen
    // Using setTimeout to avoid potential deadlocks with the auth state change listener
    setTimeout(() => {
      if (!isMounted) return;
      
      safeSupabase.auth.getSession().then(({ data: { session }, error }) => {
        if (!isMounted) return;
        
        console.log('[useAuthSessionCore] Initial session check:', { 
          hasSession: !!session,
          userId: session?.user?.id,
          userEmail: session?.user?.email,
          error: error?.message
        });
        
        if (error) {
          console.error('[useAuthSessionCore] Session check error:', error);
          setAuthError(error.message);
          setAuthChecked(true);
          setUserLoading(false);
          setCurrentView('connect');
          return;
        }
        
        if (!session || !session.user) {
          // No valid session found, staying on connect view
          setAuthChecked(true);
          setUserLoading(false);
          setCurrentView('connect');
        }
        // If session exists, the onAuthStateChange handler will be triggered
      });
    }, 0);

    return () => {
      isMounted = false;
      clearTimeout(authTimeoutId);
      
      // Clean up the subscription
      if (data && data.subscription && typeof data.subscription.unsubscribe === 'function') {
        data.subscription.unsubscribe();
      }
    };
  }, [setCurrentUser, setCurrentView, setUserLoading, setAuthChecked, setAuthError, loadCurrentUser]);
};
