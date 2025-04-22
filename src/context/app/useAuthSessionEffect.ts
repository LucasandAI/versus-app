
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AppView, User } from '@/types';
import { useLoadCurrentUser } from './useLoadCurrentUser';
import { toast } from '@/hooks/use-toast';

export const useAuthSessionEffect = (
  options: {
    setCurrentUser: (user: User | null | ((prev: User | null) => User | null)) => void;
    setCurrentView: (view: AppView) => void;
    setUserLoading: (isLoading: boolean) => void;
    setAuthChecked: (isChecked: boolean) => void;
    setAuthError: (error: string | null) => void;
  }
) => {
  const { loadCurrentUser } = useLoadCurrentUser();
  const { setCurrentUser, setCurrentView, setUserLoading, setAuthChecked, setAuthError } = options;

  useEffect(() => {
    console.log('[useAuthSessionEffect] Setting up auth session listener');
    let isMounted = true;

    // Set up the auth state change listener first
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted) return;

      console.log('[useAuthSessionEffect] Auth state changed:', {
        event,
        userId: session?.user?.id
      });

      if (event === 'SIGNED_IN' && session?.user) {
        setUserLoading(true);
        
        try {
          const userData = await loadCurrentUser(session.user.id);
          if (!isMounted) return;
          
          if (userData) {
            setCurrentUser(userData);
            setCurrentView('home');
            toast({
              title: "Signed in successfully",
              description: `Welcome back, ${userData.name || 'User'}!`
            });
          }
        } catch (error) {
          console.error('[useAuthSessionEffect] Error loading user after sign in:', error);
          if (isMounted) {
            setAuthError('Failed to load user data');
          }
        } finally {
          if (isMounted) {
            setUserLoading(false);
            setAuthChecked(true);
          }
        }
      } else if (event === 'SIGNED_OUT') {
        setCurrentUser(null);
        setCurrentView('connect');
        setAuthChecked(true);
      } else if (event === 'TOKEN_REFRESHED') {
        // Just ensure we're marked as checked when token is refreshed
        setAuthChecked(true);
      }
    });

    // Start by checking for an existing session
    const checkSession = async () => {
      try {
        setAuthChecked(false);
        const { data: sessionData, error } = await supabase.auth.getSession();

        if (!isMounted) return;

        if (error) {
          console.error('[useAuthSessionEffect] Error checking session:', error);
          setAuthError(error.message);
          setAuthChecked(true);
          return;
        }

        console.log('[useAuthSessionEffect] Initial session check:', {
          hasSession: !!sessionData?.session,
          userId: sessionData?.session?.user?.id
        });

        // If we have a session, load the user data right away
        if (sessionData?.session?.user?.id) {
          setUserLoading(true);

          try {
            const userData = await loadCurrentUser(sessionData.session.user.id);
            
            if (!isMounted) return;
            
            if (userData) {
              console.log('[useAuthSessionEffect] User data loaded:', userData.id);
              setCurrentUser(userData);
              setCurrentView('home');
            }
          } catch (loadError) {
            console.error('[useAuthSessionEffect] Error loading user:', loadError);
            if (isMounted) {
              setAuthError('Failed to load user data');
            }
          } finally {
            if (isMounted) {
              setUserLoading(false);
              setAuthChecked(true);
            }
          }
        } else {
          if (isMounted) {
            setCurrentView('connect');
            setAuthChecked(true);
          }
        }
      } catch (error) {
        console.error('[useAuthSessionEffect] Session check error:', error);
        if (isMounted) {
          setAuthChecked(true);
          setAuthError(error instanceof Error ? error.message : 'Unknown authentication error');
        }
      }
    };

    // Run the session check after setting up the listener
    checkSession();

    // Clean up
    return () => {
      isMounted = false;
      authListener.subscription.unsubscribe();
    };
  }, [
    setCurrentUser,
    setCurrentView,
    setUserLoading,
    setAuthChecked,
    setAuthError,
    loadCurrentUser,
  ]);
};
