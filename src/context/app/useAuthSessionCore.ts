
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

    // First, set up the auth state change listener
    const { data: { subscription } } = safeSupabase.auth.onAuthStateChange(async (event, session) => {
      console.log('[useAuthSessionCore] Auth state changed:', { event, userId: session?.user?.id });
      
      if (!isMounted) return;

      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        if (session?.user?.id) {
          try {
            // Only set loading if user explicitly tried to sign in (event === 'SIGNED_IN')
            if (event === 'SIGNED_IN') {
              setUserLoading(true);
            }
            
            console.log('[useAuthSessionCore] Loading user profile for ID:', session.user.id);
            
            // Create a basic user first
            const basicUser: User = {
              id: session.user.id,
              name: session.user.email || 'User',
              avatar: '/placeholder.svg',
              bio: '',
              clubs: []
            };
            
            // Set the basic user immediately for better UX
            setCurrentUser(basicUser);
            
            // Fetch full user profile in the background
            setTimeout(async () => {
              if (!isMounted) return;
              
              try {
                const userProfile = await loadCurrentUser(session.user.id);
                if (isMounted && userProfile) {
                  console.log('[useAuthSessionCore] User profile loaded:', userProfile.id);
                  setCurrentUser(userProfile);
                }
              } catch (profileError) {
                console.warn('[useAuthSessionCore] Error loading full profile, using basic user:', profileError);
              } finally {
                if (isMounted) {
                  setUserLoading(false);
                }
              }
            }, 0);
            
            // Even with just the basic user, proceed to home view
            setCurrentView('home');
            setAuthChecked(true);
          } catch (error) {
            console.error('[useAuthSessionCore] Error in auth flow:', error);
            if (isMounted) {
              setAuthError(error instanceof Error ? error.message : 'Authentication error');
              setUserLoading(false);
              setAuthChecked(true);
            }
          }
        } else {
          console.warn('[useAuthSessionCore] Session exists but no user ID');
          if (isMounted) {
            setAuthChecked(true);
            setUserLoading(false);
            setCurrentView('connect');
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
      } else {
        console.log('[useAuthSessionCore] Other auth event:', event);
        if (isMounted) {
          setAuthChecked(true);
          setUserLoading(false);
        }
      }
    });
    
    // Then, check for an existing session, but don't show loading screen
    safeSupabase.auth.getSession().then(({ data: { session }, error }) => {
      if (!isMounted) return;
      
      console.log('[useAuthSessionCore] Initial session check:', { 
        hasSession: !!session,
        userId: session?.user?.id,
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
      
      if (!session) {
        // No session found, staying on connect view
        setAuthChecked(true);
        setUserLoading(false);
        setCurrentView('connect');
      }
      // If session exists, the onAuthStateChange handler will be triggered
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
      clearTimeout(authTimeoutId);
    };
  }, [setCurrentUser, setCurrentView, setUserLoading, setAuthChecked, setAuthError, loadCurrentUser]);
};
