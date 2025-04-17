
import React, { createContext, useContext, useState, ReactNode } from 'react';
import { AppContextType, AppView, Club, User } from '../types';

// Mock data for development purposes
const mockUser: User = {
  id: '1',
  name: 'John Runner',
  avatar: '/placeholder.svg',
  stravaConnected: false,
  clubs: []
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null); // Start not logged in
  const [currentView, setCurrentView] = useState<AppView>('connect');
  const [selectedClub, setSelectedClub] = useState<Club | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const connectToStrava = () => {
    // In a real app, this would redirect to Strava OAuth
    // For now, we'll just simulate a successful connection
    setCurrentUser({
      ...mockUser,
      stravaConnected: true
    });
    setCurrentView('home');
  };

  const value = {
    currentUser,
    currentView,
    selectedClub,
    selectedUser,
    setCurrentView,
    setSelectedClub,
    setSelectedUser,
    connectToStrava
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
