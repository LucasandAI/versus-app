import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AppView, User } from '@/types';
import { useLoadCurrentUser } from './useLoadCurrentUser';

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
    console.log('[useAuthSessionCore] Setting up auth session listener');

    const checkSessionEffect = async () => {
      try {
        setAuthChecked(false);
        const { data: sessionData, error } = await supabase.auth.getSession();

        if (error) {
          throw error;
        }

        console.log('[useAuthSessionCore] Initial session check:', {
          hasSession: !!sessionData?.session,
          userId: sessionData?.session?.user?.id,
          error,
        });

        // If we have a session, load the user data right away and set current view
        if (sessionData?.session?.user?.id) {
          setUserLoading(true);

          try {
            const userData = await loadCurrentUser(sessionData.session.user.id);
            if (userData) {
              console.log('[useAuthSessionEffect] User data loaded:', userData.id);
              setCurrentUser(userData);
              setCurrentView('home');
            }
          } catch (loadError) {
            console.error('[useAuthSessionEffect] Error loading user:', loadError);
            setAuthError('Failed to load user data');
          } finally {
            setUserLoading(false);
          }
        }

        setAuthChecked(true);
      } catch (error) {
        console.error('[useAuthSessionCore] Session check error:', error);
        setAuthChecked(true);
        setAuthError(error instanceof Error ? error.message : 'Unknown authentication error');
      }
    };

    checkSessionEffect();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('[useAuthSessionCore] Auth state changed:', {
        event,
        userId: session?.user?.id
      });

      if (event === 'SIGNED_IN' && session?.user) {
        setUserLoading(true);
        
        try {
          const userData = await loadCurrentUser(session.user.id);
          if (userData) {
            setCurrentUser(userData);
            setCurrentView('home');
          }
        } catch (error) {
          console.error('[useAuthSessionCore] Error loading user after sign in:', error);
          setAuthError('Failed to load user data');
        } finally {
          setUserLoading(false);
        }
      } else if (event === 'SIGNED_OUT') {
        setCurrentUser(null);
        setCurrentView('connect');
      } else {
        console.log('[useAuthSessionCore] Other auth event:', event);
      }
    });

    return () => {
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
