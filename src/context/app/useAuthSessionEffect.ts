
import { useEffect } from 'react';
import { useAuthSessionCore } from './useAuthSessionCore';
import { User, AppView } from '@/types';

interface Props {
  setCurrentUser: React.Dispatch<React.SetStateAction<User | null>>;
  setCurrentView: React.Dispatch<React.SetStateAction<AppView>>;
  setUserLoading: (loading: boolean) => void;
  setAuthChecked: (checked: boolean) => void;
  setAuthError: (error: string | null) => void;
  setNeedsProfileCompletion?: (needsCompletion: boolean) => void;
}

/**
 * The main effect that manages authenticating the user.
 * This hook does not set initial loading state to avoid showing a loading screen
 * before the user attempts to authenticate.
 */
export const useAuthSessionEffect = ({
  setCurrentUser,
  setCurrentView,
  setUserLoading,
  setAuthChecked,
  setAuthError,
  setNeedsProfileCompletion,
}: Props) => {
  // Initial setup effect
  useEffect(() => {
    // Start with showing the connect view until we verify auth status
    setCurrentView('connect');
    console.log('[useAuthSessionEffect] Authentication effect initialized');
    setAuthChecked(false);
  }, [setAuthChecked, setCurrentView]);
  
  // Setup the auth session core which will handle auth state changes
  useAuthSessionCore({
    setCurrentUser,
    setCurrentView,
    setUserLoading,
    setAuthChecked,
    setAuthError,
    setNeedsProfileCompletion,
  });
};
