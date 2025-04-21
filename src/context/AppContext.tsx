
import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { AppContextType, AppView, User, mockUser } from './app/types';
import { updateUserInfo } from './app/useUserInfoSync';
import { useClubManagement } from './app/useClubManagement';

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState<AppView>('connect');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  
  const { selectedClub, setSelectedClub, createClub } = useClubManagement(currentUser, setCurrentUser);

  // Update selected club when currentUser changes
  useEffect(() => {
    if (selectedClub && currentUser) {
      // Find the updated club in the currentUser's clubs
      const updatedClub = currentUser.clubs.find(club => club.id === selectedClub.id);
      if (updatedClub) {
        // Merge the selected club's match history with the updated club
        const mergedClub = {
          ...updatedClub,
          matchHistory: selectedClub.matchHistory || updatedClub.matchHistory || []
        };
        setSelectedClub(mergedClub);
        
        // Also update the club in currentUser's clubs
        const updatedUserClubs = currentUser.clubs.map(club => 
          club.id === mergedClub.id ? mergedClub : club
        );
        
        setCurrentUser(prev => prev ? {
          ...prev,
          clubs: updatedUserClubs
        } : prev);
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
    setCurrentUser({
      ...mockUser,
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
