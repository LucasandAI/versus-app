import React, { useState, ReactNode, useEffect, useCallback } from 'react';
import { AppContext } from './AppContext';
import { AppContextType, User } from '@/types';
import { updateUserInfo } from './useUserInfoSync';
import { useClubManagement } from './useClubManagement';
import { useAuth } from '@/hooks/auth/useAuth';
import { useViewState } from '@/hooks/navigation/useViewState';
import { useLoadCurrentUser } from './useLoadCurrentUser';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuthSessionCore } from './useAuthSessionCore';

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [userLoading, setUserLoading] = useState(false);
  const [isSessionReady, setIsSessionReady] = useState(false);
  const [needsProfileCompletion, setNeedsProfileCompletion] = useState(false);
  const [isAppReady, setIsAppReady] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  const { signIn, signOut } = useAuth();
  const { currentView, setCurrentView, selectedClub, setSelectedClub, selectedUser, setSelectedUser } = useViewState();
  const { createClub } = useClubManagement(currentUser, setCurrentUser);
  const { loadCurrentUser } = useLoadCurrentUser();

  const refreshCurrentUser = useCallback(async () => {
    if (!currentUser?.id) return null;
    
    try {
      console.log('[AppProvider] Refreshing current user data for:', currentUser.id);
      const refreshedUser = await loadCurrentUser(currentUser.id);
      
      if (refreshedUser) {
        console.log('[AppProvider] User refreshed with clubs:', refreshedUser.clubs.length);
        setCurrentUser(refreshedUser ? updateUserInfo(refreshedUser) : null);
        return refreshedUser;
      }
      return null;
    } catch (error) {
      console.error('[AppProvider] Error refreshing user data:', error);
      toast({
        title: "Error refreshing data",
        description: "Could not load your latest information",
        variant: "destructive"
      });
      return null;
    }
  }, [currentUser, loadCurrentUser]);

  // Handle app ready state
  useEffect(() => {
    if (isSessionReady && currentUser && !userLoading) {
      setIsAppReady(true);
      setIsInitialLoad(false);
    } else if (!isSessionReady || !currentUser) {
      setIsAppReady(false);
    }
  }, [isSessionReady, currentUser, userLoading]);

  // Single timeout for auth check
  useEffect(() => {
    if (!authChecked) {
      const timeoutId = setTimeout(() => {
        console.warn('[AppProvider] Auth check timeout reached');
        setAuthChecked(true);
        setUserLoading(false);
        setCurrentView('connect');
      }, 5000);
      
      return () => clearTimeout(timeoutId);
    }
  }, [authChecked, setCurrentView]);

  useAuthSessionCore({
    setCurrentUser,
    setCurrentView,
    setUserLoading,
    setAuthChecked,
    setAuthError,
    setIsSessionReady,
  });

  const setCurrentUserWithUpdates = (userOrFunction: User | null | ((prev: User | null) => User | null)) => {
    if (typeof userOrFunction === 'function') {
      setCurrentUser(prev => {
        const newUser = userOrFunction(prev);
        console.log('[AppProvider] Updated user via function:', newUser?.id);
        return newUser ? updateUserInfo(newUser) : newUser;
      });
    } else {
      console.log('[AppProvider] Setting current user directly:', userOrFunction?.id);
      setCurrentUser(userOrFunction ? updateUserInfo(userOrFunction) : userOrFunction);
      
      if (userOrFunction && currentView === 'connect') {
        setCurrentView('home');
      }
    }
  };

  const handleSignIn = async (email: string, password: string): Promise<User | null> => {
    try {
      console.log('[AppProvider] handleSignIn called with email:', email);
      setUserLoading(true);
      setIsInitialLoad(true);
      
      const user = await signIn(email, password);
      
      if (user) {
        console.log('[AppProvider] Sign-in returned user:', user.id);
        setCurrentUserWithUpdates(user);
        return user;
      } else {
        console.error('[AppProvider] Sign-in failed, no user returned');
        setUserLoading(false);
        return null;
      }
    } catch (error) {
      console.error('[AppProvider] handleSignIn error:', error);
      setUserLoading(false);
      toast({
        title: "Login Failed",
        description: error instanceof Error ? error.message : "Unknown error during sign-in",
        variant: "destructive"
      });
      throw error;
    }
  };

  const value: AppContextType = {
    currentUser,
    currentView,
    selectedClub,
    selectedUser,
    isSessionReady,
    needsProfileCompletion,
    setNeedsProfileCompletion,
    setCurrentUser: setCurrentUserWithUpdates,
    setCurrentView,
    setSelectedClub,
    setSelectedUser,
    signIn: handleSignIn,
    signOut,
    createClub,
    refreshCurrentUser,
    isAppReady,
    setIsAppReady
  };

  // Show loading screen during initial load or when loading user data
  if (isInitialLoad || userLoading || !authChecked) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-2">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
          <p className="text-sm text-muted-foreground">
            {userLoading ? 'Loading your profile...' : 'Verifying your session...'}
          </p>
        </div>
      </div>
    );
  }

  // Only render the app content when it's ready
  if (!isAppReady) {
    return null;
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};
