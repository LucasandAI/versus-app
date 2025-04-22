
import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { AppContextType, User } from '@/types';
import { updateUserInfo } from './app/useUserInfoSync';
import { useClubManagement } from './app/useClubManagement';
import { useAuth } from '@/hooks/auth/useAuth';
import { useViewState } from '@/hooks/navigation/useViewState';
import { supabase } from '@/integrations/supabase/client';
import { ensureDivision } from '@/utils/club/leagueUtils';
import { toast } from '@/hooks/use-toast';

const AppContext = createContext<AppContextType | undefined>(undefined);

// Reduced timeout for better UX
const AUTH_TIMEOUT = 3000; // 3 seconds timeout for auth check

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [userLoading, setUserLoading] = useState(false);
  const { signIn, signOut, isLoading } = useAuth();
  const { currentView, setCurrentView, selectedClub, setSelectedClub, selectedUser, setSelectedUser } = useViewState();
  
  const { createClub } = useClubManagement(currentUser, setCurrentUser);

  // Function to handle user data loading - simplified with better error handling
  const loadCurrentUser = async (userId: string): Promise<User | null> => {
    try {
      setUserLoading(true);
      console.log('[AppContext] Loading user data for ID:', userId);
      
      const { data: userData, error } = await supabase
        .from('users')
        .select('id, name, avatar, bio')
        .eq('id', userId)
        .single();
        
      if (error) {
        console.error('[AppContext] Error fetching user profile:', error);
        setUserLoading(false);
        return null;
      }
      
      if (!userData) {
        console.error('[AppContext] No user data found for ID:', userId);
        setUserLoading(false);
        return null;
      }
      
      // Load clubs data in a separate try/catch to prevent failure if clubs can't load
      let clubs = [];
      try {
        const { data: memberships, error: clubsError } = await supabase
          .from('club_members')
          .select('club:clubs(id, name, logo, division, tier, elite_points)')
          .eq('user_id', userId);
          
        if (clubsError) {
          console.error('[AppContext] Error fetching user clubs:', clubsError);
        } else {
          clubs = memberships && memberships.length > 0
            ? memberships.map(membership => {
                if (!membership.club) return null;
                return {
                  id: membership.club.id,
                  name: membership.club.name,
                  logo: membership.club.logo || '/placeholder.svg',
                  division: ensureDivision(membership.club.division),
                  tier: membership.club.tier || 1,
                  elitePoints: membership.club.elite_points || 0,
                  members: [],
                  matchHistory: []
                };
              }).filter(Boolean)
            : [];
        }
      } catch (clubsLoadError) {
        console.error('[AppContext] Error in clubs loading:', clubsLoadError);
        // Continue even if clubs fail to load
      }
      
      const userProfile: User = {
        id: userData.id,
        name: userData.name,
        avatar: userData.avatar || '/placeholder.svg',
        bio: userData.bio,
        clubs: clubs
      };
      
      return userProfile;
    } catch (error) {
      console.error('[AppContext] Error in loadCurrentUser:', error);
      return null;
    } finally {
      setUserLoading(false);
    }
  };

  useEffect(() => {
    console.log('[AppContext] Setting up auth state listener...');
    let authTimeoutId: NodeJS.Timeout;
    
    // Set a timeout to prevent infinite loading
    authTimeoutId = setTimeout(() => {
      if (!authChecked) {
        console.error('[AppContext] Auth check timed out after', AUTH_TIMEOUT, 'ms');
        setAuthChecked(true);
        setCurrentView('connect');
        setUserLoading(false);
        setAuthError('Authentication check timed out');
      }
    }, AUTH_TIMEOUT);
    
    // First check if there's an existing session
    const checkSession = async () => {
      try {
        console.log('[AppContext] Checking auth session...');
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('[AppContext] Error checking session:', error);
          setCurrentView('connect');
          setAuthChecked(true);
          setUserLoading(false);
          setAuthError(error.message);
          return;
        }
        
        if (!session?.user) {
          console.log('[AppContext] No session found, redirecting to connect');
          setCurrentView('connect');
          setAuthChecked(true);
          setUserLoading(false);
          return;
        }
        
        console.log('[AppContext] Session found for user ID:', session.user.id);
        
        // Mark auth as checked immediately
        setAuthChecked(true);
        
        // IMPORTANT: Don't set current view to home before loading user data
        // This prevents going to home without having a valid user
        
        // Then load user data
        const userProfile = await loadCurrentUser(session.user.id);
        if (userProfile) {
          setCurrentUser(userProfile);
          // Once we have the user profile, we can navigate to home
          setCurrentView('home'); 
          console.log('[AppContext] Successfully loaded profile, navigating to home');
        } else {
          console.error('[AppContext] Failed to load user profile, redirecting to connect');
          // Redirect to connect on profile load failure
          setCurrentView('connect');
          // Sign out to clear any invalid session
          try {
            await supabase.auth.signOut();
          } catch (error) {
            console.error('[AppContext] Error signing out after profile load failure:', error);
          }
          
          toast({
            title: "Authentication failed",
            description: "Unable to load your profile. Please sign in again.",
            variant: "destructive"
          });
        }
      } catch (error) {
        console.error('[AppContext] Error in checkSession:', error);
        // Even on error, mark auth as checked and go to connect screen
        setAuthChecked(true);
        setUserLoading(false);
        setCurrentView('connect');
        setAuthError(error instanceof Error ? error.message : 'Unknown error');
      }
    };
    
    // Set up the auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('[AppContext] Auth state change:', event);
        
        if (event === 'SIGNED_IN' && session?.user) {
          // Always clear the timeout when we get an auth event
          clearTimeout(authTimeoutId);
          
          try {
            setAuthChecked(true);
            
            // We need to show a loading indicator while we load the user profile
            setUserLoading(true);
            
            // Then load user data
            const userProfile = await loadCurrentUser(session.user.id);
            if (userProfile) {
              setCurrentUser(userProfile);
              
              // Important: Only navigate to home after profile load
              setCurrentView('home');
              console.log('[AppContext] Auth state changed to SIGNED_IN, redirecting to home');
              
              toast({
                title: "Welcome back!",
                description: `Signed in as ${userProfile.name || userProfile.id}`,
              });
            } else {
              console.error('[AppContext] Failed to load user profile, redirecting to connect');
              setCurrentView('connect');
              
              // Sign out to clear any invalid session
              try {
                await supabase.auth.signOut();
              } catch (error) {
                console.error('[AppContext] Error signing out after profile load failure:', error);
              }
              
              toast({
                title: "Authentication failed",
                description: "Unable to load your profile. Please sign in again.",
                variant: "destructive"
              });
            }
          } catch (error) {
            console.error('[AppContext] Error loading user after sign in:', error);
            setCurrentView('connect');
            setAuthError(error instanceof Error ? error.message : 'Unknown error');
          } finally {
            setUserLoading(false);
          }
        } else if (event === 'SIGNED_OUT') {
          console.log('[AppContext] User signed out, clearing state');
          setCurrentUser(null);
          setCurrentView('connect');
          setAuthChecked(true);
          setUserLoading(false);
          clearTimeout(authTimeoutId);
        }
      }
    );

    // Run the session check immediately
    checkSession();
    
    return () => {
      subscription.unsubscribe();
      clearTimeout(authTimeoutId);
    };
  }, []);

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

  // Create a custom signIn function that reports more information
  const handleSignIn = async (email: string, password: string) => {
    console.log('[AppContext] Sign in requested for email:', email);
    try {
      return await signIn(email, password);
    } catch (error) {
      console.error('[AppContext] Sign in failed:', error);
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

  // Show loading state only if auth hasn't been checked yet
  if (!authChecked) {
    console.log('[AppContext] App in loading state: Auth being checked');
    return <div className="flex items-center justify-center min-h-screen">
      <div className="flex flex-col items-center gap-2">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
        <p>Loading authentication...</p>
      </div>
    </div>;
  }

  // Show loading state if user is loading after auth is checked
  if (userLoading) {
    console.log('[AppContext] App in loading state: User profile loading');
    return <div className="flex items-center justify-center min-h-screen">
      <div className="flex flex-col items-center gap-2">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
        <p>Loading your profile...</p>
      </div>
    </div>;
  }

  console.log('[AppContext] App ready:', { currentView, hasUser: !!currentUser });
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useApp = (): AppContextType => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
