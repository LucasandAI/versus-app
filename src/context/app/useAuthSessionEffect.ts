
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
  // Set initial values to ensure login screen shows by default
  setUserLoading(true);
  
  useAuthSessionCore({
    setCurrentUser,
    setCurrentView,
    setUserLoading,
    setAuthChecked,
    setAuthError,
  });
};
