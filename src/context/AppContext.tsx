
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
        // Don't show toast here, just log the error and return null
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
        
        // Load user data but don't block auth completion
        setAuthChecked(true); // Mark auth as checked immediately
        
        // Set current view to home to avoid being stuck on connect
        setCurrentView('home');
        
        // Then load user data
        const userProfile = await loadCurrentUser(session.user.id);
        if (userProfile) {
          setCurrentUser(userProfile);
        } else {
          console.error('[AppContext] Failed to load user profile, but continuing with session');
          // Create minimal user object if profile can't be loaded
          setCurrentUser({
            id: session.user.id,
            name: session.user.email?.split('@')[0] || 'User',
            avatar: '/placeholder.svg',
            clubs: []
          });
          
          toast({
            title: "Profile data incomplete",
            description: "Some user data couldn't be loaded. Try refreshing the page.",
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
            // First mark auth as checked and navigate to home
            setAuthChecked(true);
            setCurrentView('home');
            
            // Then load user data
            const userProfile = await loadCurrentUser(session.user.id);
            if (userProfile) {
              setCurrentUser(userProfile);
            } else {
              console.error('[AppContext] Failed to load user profile, but continuing with session');
              // Create minimal user object if profile can't be loaded
              setCurrentUser({
                id: session.user.id,
                name: session.user.email?.split('@')[0] || 'User',
                avatar: '/placeholder.svg',
                clubs: []
              });
              
              toast({
                title: "Profile data incomplete",
                description: "Some user data couldn't be loaded. Try refreshing the page.",
                variant: "destructive"
              });
            }
          } catch (error) {
            console.error('[AppContext] Error loading user after sign in:', error);
            // Create minimal user object if profile can't be loaded
            setCurrentUser({
              id: session.user.id,
              name: session.user.email?.split('@')[0] || 'User',
              avatar: '/placeholder.svg',
              clubs: []
            });
            setAuthError(error instanceof Error ? error.message : 'Unknown error');
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

  const value: AppContextType = {
    currentUser,
    currentView,
    selectedClub,
    selectedUser,
    setCurrentUser: setCurrentUserWithUpdates,
    setCurrentView,
    setSelectedClub,
    setSelectedUser,
    signIn,
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
