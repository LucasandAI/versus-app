
import React, { useState, ReactNode, useEffect } from 'react';
import { AppContext } from './AppContext';
import { AppContextType, User } from '@/types';
import { updateUserInfo } from './useUserInfoSync';
import { useClubManagement } from './useClubManagement';
import { useAuth } from '@/hooks/auth/useAuth';
import { useViewState } from '@/hooks/navigation/useViewState';
import { useAuthSessionEffect } from './useAuthSessionEffect';

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [userLoading, setUserLoading] = useState(false);  // Start with loading state false

  const { signIn, signOut } = useAuth();
  const { currentView, setCurrentView, selectedClub, setSelectedClub, selectedUser, setSelectedUser } = useViewState();
  const { createClub } = useClubManagement(currentUser, setCurrentUser);

  // Set a timeout to ensure we don't get stuck in loading state forever
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (!authChecked) {
        console.warn('[AppProvider] Auth check timeout reached, forcing auth checked state');
        setAuthChecked(true);
        setUserLoading(false);
      }
    }, 15000); // 15 second timeout as a safety net

    return () => clearTimeout(timeoutId);
  }, [authChecked]);

  // Set up auth session effect
  useAuthSessionEffect({
    setCurrentUser,
    setCurrentView,
    setUserLoading,
    setAuthChecked,
    setAuthError,
  });

  const setCurrentUserWithUpdates = (userOrFunction: User | null | ((prev: User | null) => User | null)) => {
    if (typeof userOrFunction === 'function') {
      setCurrentUser(prev => {
        const newUser = userOrFunction(prev);
        return newUser ? updateUserInfo(newUser) : newUser;
      });
    } else {
      setCurrentUser(userOrFunction ? updateUserInfo(userOrFunction) : userOrFunction);
    }
  };

  const handleSignIn = async (email: string, password: string): Promise<User | null> => {
    try {
      return await signIn(email, password);
    } catch (error) {
      throw error;
    }
  };

  const value: AppContextType = {
    currentUser,
    currentView,
    selectedClub,
    selectedUser,
    setCurrentUser: setCurrentUserWithUpdates,
    setCurrentView,
    setSelectedClub,
    setSelectedUser,
    signIn: handleSignIn,
    signOut,
    createClub
  };

  if (!authChecked) {
    console.log('[AppProvider] Auth not checked yet, showing loading screen');
    return <div className="flex items-center justify-center min-h-screen">
      <div className="flex flex-col items-center gap-2">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
        <p>Loading authentication...</p>
      </div>
    </div>;
  }

  if (userLoading && currentUser) {
    console.log('[AppProvider] User is loading and we have a currentUser, showing loading screen');
    return <div className="flex items-center justify-center min-h-screen">
      <div className="flex flex-col items-center gap-2">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
        <p>Loading your profile...</p>
      </div>
    </div>;
  }

  console.log('[AppProvider] Rendering app with:', { 
    authChecked, 
    userLoading, 
    currentUser: currentUser ? 'exists' : 'null',
    currentView 
  });

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};
