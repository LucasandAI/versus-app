
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { User } from '@/types';
import { useLoadCurrentUser } from './useLoadCurrentUser';

interface Props {
  setCurrentUser: React.Dispatch<React.SetStateAction<User | null>>;
  setCurrentView: (view: string) => void;
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
    }, AUTH_TIMEOUT);

    // First check if there's an existing session
    const checkSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          setCurrentView('connect');
          setAuthChecked(true);
          setUserLoading(false);
          setAuthError(error.message);
          return;
        }
        if (!session?.user) {
          setCurrentView('connect');
          setAuthChecked(true);
          setUserLoading(false);
          return;
        }
        setAuthChecked(true);

        const userProfile = await loadCurrentUser(session.user.id);
        if (userProfile) {
          setCurrentUser(userProfile);
          setCurrentView('home');
        } else {
          setCurrentView('connect');
          try {
            await supabase.auth.signOut();
          } catch (error) {}
          toast({
            title: "Authentication failed",
            description: "Unable to load your profile. Please sign in again.",
            variant: "destructive"
          });
        }
      } catch (error) {
        setAuthChecked(true);
        setUserLoading(false);
        setCurrentView('connect');
        setAuthError(error instanceof Error ? error.message : 'Unknown error');
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          clearTimeout(authTimeoutId);
          try {
            setAuthChecked(true);
            setUserLoading(true);
            const userProfile = await loadCurrentUser(session.user.id);
            if (userProfile) {
              setCurrentUser(userProfile);
              setCurrentView('home');
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
                description: "Unable to load your profile. Please sign in again.",
                variant: "destructive"
              });
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
