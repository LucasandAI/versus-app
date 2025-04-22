
import { useEffect } from 'react';
import { useAuthSessionCore, AUTH_TIMEOUT } from './useAuthSessionCore';
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
 */
export const useAuthSessionEffect = ({
  setCurrentUser,
  setCurrentView,
  setUserLoading,
  setAuthChecked,
  setAuthError,
}: Props) => {
  // Setup the initial loading state
  useEffect(() => {
    // Set initial loading state in the effect
    // This ensures it only runs once
    setUserLoading(true);
  }, []); // Empty dependency array ensures this only runs once
  
  // Setup the auth session core
  useAuthSessionCore({
    setCurrentUser,
    setCurrentView,
    setUserLoading,
    setAuthChecked,
    setAuthError,
  });
};
