
import React, { useState, ReactNode, useEffect } from 'react';
import { AppContext } from './AppContext';
import { AppContextType, User } from '@/types';
import { updateUserInfo } from './useUserInfoSync';
import { useClubManagement } from './useClubManagement';
import { useAuth } from '@/hooks/auth/useAuth';
import { useViewState } from '@/hooks/navigation/useViewState';
import { useAuthSessionEffect } from './useAuthSessionEffect';
import { toast } from '@/hooks/use-toast';

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authChecked, setAuthChecked] = useState(true); // Default to true to avoid initial loading screen
  const [authError, setAuthError] = useState<string | null>(null);
  const [userLoading, setUserLoading] = useState(false); // Default to false to avoid initial loading screen

  const { signIn, signOut } = useAuth();
  const { currentView, setCurrentView, selectedClub, setSelectedClub, selectedUser, setSelectedUser } = useViewState();
  const { createClub } = useClubManagement(currentUser, setCurrentUser);

  // Debugging state changes
  useEffect(() => {
    console.log('[AppProvider] State changed:', { 
      authChecked, 
      userLoading, 
      currentUser: currentUser?.id || 'null',
      currentView 
    });
  }, [authChecked, userLoading, currentUser, currentView]);

  // Set a timeout to ensure we don't get stuck in loading state forever
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (!authChecked) {
        console.warn('[AppProvider] Auth check timeout reached, forcing auth checked state');
        setAuthChecked(true);
        setUserLoading(false);
        // Force to connect view if we time out
        setCurrentView('connect');
      }
    }, 15000); // 15 second timeout as a safety net
    
    return () => clearTimeout(timeoutId);
  }, [authChecked, setCurrentView]);
  
  // Add another timeout to prevent getting stuck in user loading state
  useEffect(() => {
    if (userLoading) {
      const timeoutId = setTimeout(() => {
        console.warn('[AppProvider] User loading timeout reached, forcing completion');
        setUserLoading(false);
        
        if (currentUser) {
          // If we have a basic user but profile loading timed out, still show home
          setCurrentView('home');
          toast({
            title: "Profile partially loaded",
            description: "Some user data may be missing. Please refresh if needed.",
            variant: "destructive"
          });
        } else {
          // If no user after timeout, go to connect
          setCurrentView('connect');
        }
      }, 10000); // 10 second timeout for user loading
      
      return () => clearTimeout(timeoutId);
    }
  }, [userLoading, currentUser, setCurrentView]);

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
        console.log('[AppProvider] Updated user via function:', newUser?.id);
        return newUser ? updateUserInfo(newUser) : newUser;
      });
    } else {
      console.log('[AppProvider] Setting current user directly:', userOrFunction?.id);
      setCurrentUser(userOrFunction ? updateUserInfo(userOrFunction) : userOrFunction);
      
      // If we're setting a user directly and we're not in home view, change the view
      if (userOrFunction && currentView === 'connect') {
        console.log('[AppProvider] Changing view to home after user set');
        setCurrentView('home');
      }
    }
  };

  const handleSignIn = async (email: string, password: string): Promise<User | null> => {
    try {
      console.log('[AppProvider] handleSignIn called with email:', email);
      // Set loading state when user explicitly tries to sign in
      setUserLoading(true);
      
      const user = await signIn(email, password);
      
      if (user) {
        console.log('[AppProvider] Sign-in returned user:', user.id);
        // Set the basic user immediately to improve perceived performance
        setCurrentUserWithUpdates(user);
        // The full profile will be loaded by the auth session effect
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
    setCurrentUser: setCurrentUserWithUpdates,
    setCurrentView,
    setSelectedClub,
    setSelectedUser,
    signIn: handleSignIn,
    signOut,
    createClub
  };

  if (!authChecked && userLoading) {
    console.log('[AppProvider] Auth not checked yet and user is loading, showing loading screen');
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
