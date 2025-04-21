
import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { AppContextType, AppView, User, mockUser } from './app/types';
import { updateUserInfo } from './app/useUserInfoSync';
import { useClubManagement } from './app/useClubManagement';

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  
  // Always start with connect view by default, then update based on auth status
  const [currentView, setCurrentView] = useState<AppView>('connect');
  
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  
  const { selectedClub, setSelectedClub, createClub } = useClubManagement(currentUser, setCurrentUser);

  // Update currentView when authentication status changes
  useEffect(() => {
    if (currentUser?.stravaConnected) {
      setCurrentView('home');
    } else {
      setCurrentView('connect');
    }
  }, [currentUser?.stravaConnected]);

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
      } else {
        setSelectedClub(null);
      }
    }
  }, [currentUser, selectedClub?.id]);

  // Update selected user when current user changes
  useEffect(() => {
    if (selectedUser && currentUser && selectedUser.id === currentUser.id) {
      setSelectedUser(currentUser);
    }
  }, [currentUser, selectedUser]);

  const connectToStrava = () => {
    // Remove match history from mock data to prevent conflicts
    const cleanedMockUser = {
      ...mockUser,
      clubs: mockUser.clubs.map(club => ({
        ...club,
        matchHistory: [] // Clear mock match history
      }))
    };

    setCurrentUser({
      ...cleanedMockUser,
      stravaConnected: true
    });
    setCurrentView('home');
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
