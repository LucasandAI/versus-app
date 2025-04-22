
import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { AppContextType, AppView, User } from './app/types';
import { updateUserInfo } from './app/useUserInfoSync';
import { useClubManagement } from './app/useClubManagement';
import { supabase } from '@/integrations/supabase/client';
import { ClubMember, Club } from '@/types';

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState<AppView>('connect');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const { selectedClub, setSelectedClub, createClub } = useClubManagement(currentUser, setCurrentUser);

  // Load user data on authentication state change
  useEffect(() => {
    const loadCurrentUser = async (userId: string) => {
      setIsLoading(true);
      try {
        // Fetch user data from Supabase
        const { data: userData, error } = await supabase
          .from('users')
          .select('id, name, avatar, strava_connected, bio')
          .eq('id', userId)
          .single();
          
        if (error) {
          console.error('Error fetching user profile:', error);
          return;
        }
        
        // Fetch user's clubs from Supabase via club_members join table
        const { data: memberships, error: clubsError } = await supabase
          .from('club_members')
          .select('club_id, is_admin, club:clubs(id, name, logo, division, tier, elite_points)')
          .eq('user_id', userId);
          
        if (clubsError) {
          console.error('Error fetching user clubs:', clubsError);
        }
        
        // Transform the clubs data
        const clubs: Club[] = [];
        
        if (memberships && memberships.length > 0) {
          for (const membership of memberships) {
            if (!membership.club) continue;
            
            // Fetch club members
            const { data: membersData, error: membersError } = await supabase
              .from('club_members')
              .select('user_id, is_admin, users(id, name, avatar)')
              .eq('club_id', membership.club.id);
              
            if (membersError) {
              console.error('Error fetching club members:', membersError);
              continue;
            }
            
            // Transform members data
            const members: ClubMember[] = membersData.map(member => ({
              id: member.users.id,
              name: member.users.name,
              avatar: member.users.avatar || '/placeholder.svg',
              isAdmin: member.is_admin,
              distanceContribution: 0 // Default value
            }));
            
            // Fetch match history
            const { data: matchHistory, error: matchError } = await supabase
              .from('matches')
              .select('*')
              .or(`home_club_id.eq.${membership.club.id},away_club_id.eq.${membership.club.id}`)
              .order('end_date', { ascending: false });
              
            if (matchError) {
              console.error('Error fetching match history:', matchError);
            }
            
            // Transform club data
            clubs.push({
              id: membership.club.id,
              name: membership.club.name,
              logo: membership.club.logo || '/placeholder.svg',
              division: membership.club.division,
              tier: membership.club.tier || 1,
              elitePoints: membership.club.elite_points,
              members: members,
              matchHistory: matchHistory || []
            });
          }
        }
        
        // Update the current user with the fetched data
        setCurrentUser({
          id: userData.id,
          name: userData.name,
          avatar: userData.avatar || '/placeholder.svg',
          stravaConnected: Boolean(userData.strava_connected),
          bio: userData.bio,
          clubs: clubs
        });
      } catch (error) {
        console.error('Error in loadCurrentUser:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    // Listen to auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          loadCurrentUser(session.user.id);
        } else if (event === 'SIGNED_OUT') {
          setCurrentUser(null);
          setCurrentView('connect');
        }
      }
    );
    
    // Check for existing session
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        loadCurrentUser(session.user.id);
      }
    };
    
    checkSession();
    
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Update selected club when currentUser changes
  useEffect(() => {
    if (selectedClub && currentUser) {
      // Find the club in currentUser's clubs
      const userClub = currentUser.clubs.find(club => club.id === selectedClub.id);
      
      if (userClub) {
        // Only update if the selected club has no match history or if the user's club has more recent matches
        const shouldUpdateFromUser = !selectedClub.matchHistory?.length || 
          (userClub.matchHistory?.length && 
           new Date(userClub.matchHistory[0]?.endDate || 0) > 
           new Date(selectedClub.matchHistory[0]?.endDate || 0));

        if (shouldUpdateFromUser) {
          console.log('Updating selected club from user clubs');
          setSelectedClub(userClub);
        } else {
          console.log('Preserving selected club match history');
          // Update the club in currentUser's clubs to match selectedClub
          const updatedClubs = currentUser.clubs.map(club => 
            club.id === selectedClub.id ? selectedClub : club
          );
          
          setCurrentUser(prev => prev ? {
            ...prev,
            clubs: updatedClubs
          } : prev);
        }
      } else if (!selectedClub.isPreviewClub) {
        // Only preserve the club if it's marked as a preview club
        console.log('Preserving non-member preview club');
      }
    }
  }, [currentUser, selectedClub?.id]);

  // Update selected user when current user changes
  useEffect(() => {
    if (selectedUser && currentUser && selectedUser.id === currentUser.id) {
      setSelectedUser(currentUser);
    }
  }, [currentUser, selectedUser]);

  const connectToStrava = async () => {
    setIsLoading(true);
    
    try {
      // In a real app, you would initiate a Strava OAuth flow
      // For now, create a mock user in Supabase and return success
      
      // Generate a random UUID for testing
      const mockUserId = crypto.randomUUID();
      
      // Create a new user in Supabase
      const { error: userError } = await supabase
        .from('users')
        .insert({
          id: mockUserId,
          name: 'Test User',
          avatar: '/placeholder.svg',
          strava_connected: true
        });
        
      if (userError) {
        console.error('Error creating user:', userError);
        return;
      }
      
      // Set up a mock session
      await supabase.auth.signInWithPassword({
        email: 'test@example.com',
        password: 'password123'
      });
      
      setCurrentView('home');
    } catch (error) {
      console.error('Error connecting to Strava:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Override setCurrentUser to update all references to the user
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

  const value = {
    currentUser,
    currentView,
    selectedClub,
    selectedUser,
    setCurrentUser: setCurrentUserWithUpdates,
    setCurrentView,
    setSelectedClub,
    setSelectedUser,
    connectToStrava,
    createClub
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useApp = (): AppContextType => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
