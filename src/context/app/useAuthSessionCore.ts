
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

    // Setup the auth state change listener
    const { data: { subscription } } = safeSupabase.auth.onAuthStateChange(handleAuthChange);
    
    // Skip automatic session check and mark auth as checked immediately
    // This way we won't show a loading screen on initial app load
    setAuthChecked(true);
    setUserLoading(false);
    setCurrentView('connect');

    return () => {
      isMounted = false;
      subscription.unsubscribe();
      clearTimeout(authTimeoutId);
    };
  }, [setCurrentUser, setCurrentView, setUserLoading, setAuthChecked, setAuthError, loadCurrentUser]);
};
