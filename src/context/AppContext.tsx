
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

const AUTH_TIMEOUT = 10000; // 10 seconds timeout for auth check

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [userLoading, setUserLoading] = useState(false);
  const { signIn, signOut, isLoading } = useAuth();
  const { currentView, setCurrentView, selectedClub, setSelectedClub, selectedUser, setSelectedUser } = useViewState();
  
  const { createClub } = useClubManagement(currentUser, setCurrentUser);

  // Function to handle user data loading
  const loadCurrentUser = async (userId: string) => {
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
        toast({
          title: "Error loading profile",
          description: "Could not load your profile data. Please try again.",
          variant: "destructive"
        });
        setUserLoading(false);
        // Important: Don't change currentView or currentUser here
        return null;
      }
      
      if (!userData) {
        console.error('[AppContext] No user data found for ID:', userId);
        setUserLoading(false);
        return null;
      }
      
      console.log('[AppContext] User data loaded:', userData);
      
      const { data: memberships, error: clubsError } = await supabase
        .from('club_members')
        .select('club:clubs(id, name, logo, division, tier, elite_points)')
        .eq('user_id', userId);
        
      if (clubsError) {
        console.error('[AppContext] Error fetching user clubs:', clubsError);
      }
      
      const clubs = memberships && memberships.length > 0
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
        
        // Load user data
        const userProfile = await loadCurrentUser(session.user.id);
        if (userProfile) {
          setCurrentUser(userProfile);
          setCurrentView('home');
        } else {
          // If we couldn't load user data but have a session, still redirect to home
          // The app can attempt to reload user data later
          setCurrentView('connect');
        }
        
        // IMPORTANT: Always set authChecked even if user loading fails
        setAuthChecked(true);
        
      } catch (error) {
        console.error('[AppContext] Error in checkSession:', error);
        // Even on error, mark auth as checked and go to connect screen
        setAuthChecked(true);
        setUserLoading(false);
        setCurrentView('connect');
      }
    };
    
    // Set up the auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('[AppContext] Auth state change:', event);
        
        if (event === 'SIGNED_IN' && session?.user) {
          try {
            const userProfile = await loadCurrentUser(session.user.id);
            if (userProfile) {
              setCurrentUser(userProfile);
              setCurrentView('home');
            } else {
              // If loading user data fails, go to connect screen
              setCurrentView('connect');
            }
          } catch (error) {
            console.error('[AppContext] Error loading user after sign in:', error);
            setCurrentUser(null);
            setCurrentView('connect');
          } finally {
            // Always set authChecked to true
            setAuthChecked(true);
            setUserLoading(false);
          }
        } else if (event === 'SIGNED_OUT') {
          console.log('[AppContext] User signed out, clearing state');
          setCurrentUser(null);
          setCurrentView('connect');
          setAuthChecked(true);
          setUserLoading(false);
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
        <p>Loading...</p>
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
