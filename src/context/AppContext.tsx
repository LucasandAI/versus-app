
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

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [userLoading, setUserLoading] = useState(true);
  const { signIn, signOut, isLoading } = useAuth();
  const { currentView, setCurrentView, selectedClub, setSelectedClub, selectedUser, setSelectedUser } = useViewState();
  
  const { createClub } = useClubManagement(currentUser, setCurrentUser);

  useEffect(() => {
    const loadCurrentUser = async (userId: string) => {
      try {
        setUserLoading(true);
        console.log('Loading user data for ID:', userId);
        
        const { data: userData, error } = await supabase
          .from('users')
          .select('id, name, avatar, bio')
          .eq('id', userId)
          .single();
          
        if (error) {
          console.error('Error fetching user profile:', error);
          toast({
            title: "Error loading profile",
            description: "Could not load your profile data. Please try again.",
            variant: "destructive"
          });
          setUserLoading(false);
          // Set currentView to 'connect' if user data can't be loaded
          setCurrentView('connect');
          return;
        }
        
        if (!userData) {
          console.error('No user data found for ID:', userId);
          // If no user data is found, redirect to connect screen
          setCurrentView('connect');
          setUserLoading(false);
          return;
        }
        
        console.log('User data loaded:', userData);
        
        const { data: memberships, error: clubsError } = await supabase
          .from('club_members')
          .select('club:clubs(id, name, logo, division, tier, elite_points)')
          .eq('user_id', userId);
          
        if (clubsError) {
          console.error('Error fetching user clubs:', clubsError);
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
        
        setCurrentUser({
          id: userData.id,
          name: userData.name,
          avatar: userData.avatar || '/placeholder.svg',
          bio: userData.bio,
          clubs: clubs
        });
        
        setCurrentView('home');
        setUserLoading(false);
      } catch (error) {
        console.error('Error in loadCurrentUser:', error);
        setUserLoading(false);
        // Fallback to connect screen if there's any error
        setCurrentView('connect');
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state change:', event);
        if (event === 'SIGNED_IN' && session?.user) {
          await loadCurrentUser(session.user.id);
        } else if (event === 'SIGNED_OUT') {
          setCurrentUser(null);
          setCurrentView('connect');
          setUserLoading(false);
        }
      }
    );

    const checkSession = async () => {
      try {
        console.log('Checking auth session...');
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error checking session:', error);
          setCurrentView('connect');
          setAuthChecked(true);
          setUserLoading(false);
          return;
        }
        
        if (session?.user) {
          console.log('Session found, loading user data');
          await loadCurrentUser(session.user.id);
        } else {
          console.log('No session found, redirecting to connect');
          setCurrentView('connect');
          setUserLoading(false);
        }
        
        setAuthChecked(true);
      } catch (error) {
        console.error('Error in checkSession:', error);
        setAuthChecked(true);
        setUserLoading(false);
        setCurrentView('connect');
      }
    };
    
    checkSession();
    
    return () => {
      subscription.unsubscribe();
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

  // Show loading state only if we're checking auth or loading user data
  if (!authChecked || userLoading) {
    console.log('App in loading state:', { authChecked, userLoading });
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  console.log('App ready:', { currentView, hasUser: !!currentUser });
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useApp = (): AppContextType => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
