
import { useEffect } from 'react';
import { useAuthSessionCore } from './useAuthSessionCore';
import { User, AppView } from '@/types';

interface Props {
  setCurrentUser: React.Dispatch<React.SetStateAction<User | null>>;
  setCurrentView: React.Dispatch<React.SetStateAction<AppView>>;
  setUserLoading: (loading: boolean) => void;
  setAuthChecked: (checked: boolean) => void;
  setAuthError: (error: string | null) => void;
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
}: Props) => {
  useEffect(() => {
    // Set initial state - we don't want to show loading until user attempts login
    setAuthChecked(true);
    setUserLoading(false);
    
    // This will only show the connect view if there's no stored session
    setCurrentView('connect');
    
    console.log('[useAuthSessionEffect] Authentication effect initialized without loading state');
  }, [setAuthChecked, setUserLoading, setCurrentView]);
  
  // Setup the auth session core which will handle auth state changes
  useAuthSessionCore({
    setCurrentUser,
    setCurrentView,
    setUserLoading,
    setAuthChecked,
    setAuthError,
  });
};
