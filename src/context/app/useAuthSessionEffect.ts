
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { User, AppView } from '@/types';
import { useLoadCurrentUser } from './useLoadCurrentUser';

interface Props {
  setCurrentUser: React.Dispatch<React.SetStateAction<User | null>>;
  setCurrentView: React.Dispatch<React.SetStateAction<AppView>>;
  setUserLoading: (loading: boolean) => void;
  setAuthChecked: (checked: boolean) => void;
  setAuthError: (error: string | null) => void;
}

export const AUTH_TIMEOUT = 5000; // 5 seconds

export const useAuthSessionEffect = ({
  setCurrentUser,
  setCurrentView,
  setUserLoading,
  setAuthChecked,
  setAuthError,
}: Props) => {
  const { loadCurrentUser } = useLoadCurrentUser();

  useEffect(() => {
    console.log('[AppProvider] Setting up auth state listener...');
    let authTimeoutId: number;

    authTimeoutId = window.setTimeout(() => {
      setAuthChecked(true);
      setCurrentView('connect');
      setUserLoading(false);
      setAuthError('Authentication check timed out');
      console.warn('[useAuthSessionEffect] Auth check timed out after', AUTH_TIMEOUT, 'ms');
    }, AUTH_TIMEOUT);

    // First check if there's an existing session
    const checkSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        console.log('[useAuthSessionEffect] getSession result:', { session, error });
        if (error) {
          setCurrentView('connect');
          setAuthChecked(true);
          setUserLoading(false);
          setAuthError(error.message);
          console.error('[useAuthSessionEffect] Error in getSession:', error);
          return;
        }
        if (!session?.user) {
          setCurrentView('connect');
          setAuthChecked(true);
          setUserLoading(false);
          console.log('[useAuthSessionEffect] No session or user. Redirecting to connect screen.');
          return;
        }
        setAuthChecked(true);

        console.log('[useAuthSessionEffect] Session detected for user ID:', session.user.id);
        const userProfile = await loadCurrentUser(session.user.id);
        if (userProfile) {
          setCurrentUser(userProfile);
          setCurrentView('home');
          console.log('[useAuthSessionEffect] Loaded user profile, switching to home.');
        } else {
          setCurrentView('connect');
          try {
            await supabase.auth.signOut();
          } catch (error) {}
          toast({
            title: "Authentication failed",
            description: "Unable to load your profile. Please sign in again. (Missing row in users table?)",
            variant: "destructive"
          });
          console.warn('[useAuthSessionEffect] User row missing in users table for id', session.user.id);
        }
      } catch (error) {
        setAuthChecked(true);
        setUserLoading(false);
        setCurrentView('connect');
        setAuthError(error instanceof Error ? error.message : 'Unknown error');
        console.error('[useAuthSessionEffect] Exception during checkSession:', error);
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('[useAuthSessionEffect] onAuthStateChange event:', event, session);
        if (event === 'SIGNED_IN' && session?.user) {
          clearTimeout(authTimeoutId);
          try {
            setAuthChecked(true);
            setUserLoading(true);
            // Log the session to verify contents
            console.log('[useAuthSessionEffect] SIGNED_IN: session.user:', session.user);
            const userProfile = await loadCurrentUser(session.user.id);
            if (userProfile) {
              setCurrentUser(userProfile);
              setCurrentView('home');
              console.log('[useAuthSessionEffect] User authenticated and profile loaded, home view.');
              toast({
                title: "Welcome back!",
                description: `Signed in as ${userProfile.name || userProfile.id}`,
              });
            } else {
              setCurrentView('connect');
              try {
                await supabase.auth.signOut();
              } catch (error) {}
              toast({
                title: "Authentication failed",
                description: "Unable to load your profile. Please sign in again. (Missing row in users table?)",
                variant: "destructive"
              });
              console.warn('[useAuthSessionEffect] User row missing in users table for id', session.user.id);
            }
          } finally {
            setUserLoading(false);
          }
        } else if (event === 'SIGNED_OUT') {
          setCurrentUser(null);
          setCurrentView('connect');
          setAuthChecked(true);
          setUserLoading(false);
          clearTimeout(authTimeoutId);
          console.log('[useAuthSessionEffect] SIGNED_OUT: Cleared user and returned to connect view.');
        }
      }
    );

    checkSession();

    return () => {
      subscription.unsubscribe();
      clearTimeout(authTimeoutId);
    };
  }, [setCurrentUser, setCurrentView, setUserLoading, setAuthChecked, setAuthError, loadCurrentUser]);
};

