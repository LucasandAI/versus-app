
import { useEffect } from 'react';
import { safeSupabase } from '@/integrations/supabase/safeClient';
import { AppView, User } from '@/types';
import { useLoadCurrentUser } from './useLoadCurrentUser';
import { toast } from '@/hooks/use-toast';

// Timeout for authentication check (15 seconds)
export const AUTH_TIMEOUT = 15000;

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
    
    console.log('[useAuthSessionCore] Setting up auth session effect');

    const handleAuthChange = async (event: string, session: any) => {
      console.log('[useAuthSessionCore] Auth state changed:', { event, userId: session?.user?.id });
      
      if (!isMounted) return;

      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        if (session?.user?.id) {
          try {
            setUserLoading(true);
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
            
            // Then load the full profile
            const userProfile = await loadCurrentUser(session.user.id);
            if (isMounted) {
              if (userProfile) {
                console.log('[useAuthSessionCore] User profile loaded:', userProfile.id);
                setCurrentUser(userProfile);
              } else {
                console.warn('[useAuthSessionCore] Using basic user profile');
              }
              
              // Even with a basic user, proceed to home view
              setCurrentView('home');
              setUserLoading(false);
              setAuthChecked(true);
            }
          } catch (error) {
            console.error('[useAuthSessionCore] Error loading user profile:', error);
            if (isMounted) {
              setAuthError(error instanceof Error ? error.message : 'Failed to load user profile');
              
              // If we had errors loading the profile but auth succeeded, still show home with basic user
              setCurrentView('home');
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
    };

    // Initial session check
    const checkCurrentSession = async () => {
      try {
        console.log('[useAuthSessionCore] Checking current session');
        const { data: { session }, error } = await safeSupabase.auth.getSession();
        
        console.log('[useAuthSessionCore] Current session check result:', { 
          hasSession: !!session,
          userId: session?.user?.id,
          error: error ? error.message : 'none'
        });

        if (error) {
          console.error('[useAuthSessionCore] Session check error:', error);
          if (isMounted) {
            setAuthError(error.message);
            setCurrentView('connect');
            setAuthChecked(true);
            setUserLoading(false);
          }
        } else if (session?.user) {
          // Let the auth state change handler handle loading the user
          console.log('[useAuthSessionCore] Found existing session for user:', session.user.id);
          
          // Create a basic user immediately
          const basicUser: User = {
            id: session.user.id,
            name: session.user.email || 'User',
            avatar: '/placeholder.svg',
            bio: '',
            clubs: []
          };
          
          setCurrentUser(basicUser);
          
          // Let the auth state change handler handle the rest
          // (It will be triggered by onAuthStateChange)
        } else {
          console.log('[useAuthSessionCore] No session found, showing connect view');
          if (isMounted) {
            setCurrentView('connect');
            setAuthChecked(true);
            setUserLoading(false);
          }
        }
      } catch (error) {
        console.error('[useAuthSessionCore] Error checking session:', error);
        if (isMounted) {
          setAuthError(error instanceof Error ? error.message : 'Failed to check authentication');
          setCurrentView('connect');
          setAuthChecked(true);
          setUserLoading(false);
        }
      }
    };

    // First, set up the auth state change listener
    const { data: { subscription } } = safeSupabase.auth.onAuthStateChange(handleAuthChange);
    
    // Then check for an existing session
    checkCurrentSession();

    // Set timeout to ensure we don't get stuck in checking state
    authTimeoutId = setTimeout(() => {
      if (isMounted) {
        console.warn('[useAuthSessionCore] Auth check timeout reached');
        setAuthChecked(true);
        setUserLoading(false);
        setCurrentView('connect');
        toast({
          title: "Authentication Timeout",
          description: "Please try again or check your connection",
          variant: "destructive"
        });
      }
    }, AUTH_TIMEOUT);

    return () => {
      isMounted = false;
      subscription.unsubscribe();
      clearTimeout(authTimeoutId);
    };
  }, [setCurrentUser, setCurrentView, setUserLoading, setAuthChecked, setAuthError, loadCurrentUser]);
};
