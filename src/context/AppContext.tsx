
import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { AppContextType, User } from '@/types';
import { updateUserInfo } from './app/useUserInfoSync';
import { useClubManagement } from './app/useClubManagement';
import { useAuth } from '@/hooks/auth/useAuth';
import { useViewState } from '@/hooks/navigation/useViewState';
import { supabase } from '@/integrations/supabase/client';
import { ensureDivision } from '@/utils/club/leagueUtils';

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const { signIn, signOut, isLoading } = useAuth();
  const { currentView, setCurrentView, selectedClub, setSelectedClub, selectedUser, setSelectedUser } = useViewState();
  
  const { createClub } = useClubManagement(currentUser, setCurrentUser);

  useEffect(() => {
    const loadCurrentUser = async (userId: string) => {
      try {
        const { data: userData, error } = await supabase
          .from('users')
          .select('id, name, avatar, bio')
          .eq('id', userId)
          .single();
          
        if (error || !userData) {
          console.error('Error fetching user profile:', error);
          return;
        }
        
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
      } catch (error) {
        console.error('Error in loadCurrentUser:', error);
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          await loadCurrentUser(session.user.id);
        } else if (event === 'SIGNED_OUT') {
          setCurrentUser(null);
          setCurrentView('connect');
        }
      }
    );

    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        await loadCurrentUser(session.user.id);
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

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useApp = (): AppContextType => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
