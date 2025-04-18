
import React, { createContext, useContext, useState, ReactNode } from 'react';
import { AppContextType, AppView, Club, User } from '../types';

// Mock data for development purposes
const mockUser: User = {
  id: '1',
  name: 'John Runner',
  avatar: '/placeholder.svg',
  stravaConnected: false,
  clubs: [
    {
      id: '1',
      name: 'Weekend Warriors',
      logo: '/placeholder.svg',
      division: 'Silver',
      tier: 2,
      members: [
        { id: '1', name: 'John Runner', avatar: '/placeholder.svg', isAdmin: true },
        { id: '2', name: 'Jane Sprinter', avatar: '/placeholder.svg', isAdmin: false },
        { id: '3', name: 'Bob Marathon', avatar: '/placeholder.svg', isAdmin: false },
        { id: '4', name: 'Emma Jogger', avatar: '/placeholder.svg', isAdmin: false },
        { id: '5', name: 'Tom Walker', avatar: '/placeholder.svg', isAdmin: false },
      ],
      matchHistory: []
    },
    {
      id: '2',
      name: 'Road Runners',
      logo: '/placeholder.svg',
      division: 'Gold',
      tier: 1,
      members: [
        { id: '1', name: 'John Runner', avatar: '/placeholder.svg', isAdmin: true },
        { id: '7', name: 'Alice Sprint', avatar: '/placeholder.svg', isAdmin: false },
        { id: '8', name: 'Charlie Run', avatar: '/placeholder.svg', isAdmin: false },
        { id: '11', name: 'Olivia Pace', avatar: '/placeholder.svg', isAdmin: false },
        { id: '12', name: 'Paul Path', avatar: '/placeholder.svg', isAdmin: false },
      ],
      matchHistory: []
    }
  ],
  bio: '',
  instagram: '',
  twitter: '',
  facebook: '',
  linkedin: '',
  website: '',
  tiktok: ''
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
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

  const createClub = (name: string, logo: string) => {
    if (currentUser) {
      const newClub: Club = {
        id: Math.random().toString(36).substr(2, 9),
        name,
        logo,
        division: 'Bronze',
        tier: 5,
        members: [
          {
            id: currentUser.id,
            name: currentUser.name,
            avatar: currentUser.avatar,
            isAdmin: true
          }
        ],
        matchHistory: [],
        // Add a mock current match for newly created clubs
        currentMatch: {
          id: `m-${Math.random().toString(36).substr(2, 9)}`,
          homeClub: {
            id: Math.random().toString(36).substr(2, 9),
            name: name,
            logo: logo,
            totalDistance: 25.5,
            members: [
              {
                id: currentUser.id,
                name: currentUser.name,
                avatar: currentUser.avatar,
                isAdmin: true,
                distanceContribution: 25.5
              }
            ]
          },
          awayClub: {
            id: Math.random().toString(36).substr(2, 9),
            name: 'Challenger Team',
            logo: '/placeholder.svg',
            totalDistance: 22.3,
            members: [
              { id: 'c1', name: 'Runner 1', avatar: '/placeholder.svg', isAdmin: false, distanceContribution: 7.5 },
              { id: 'c2', name: 'Runner 2', avatar: '/placeholder.svg', isAdmin: false, distanceContribution: 7.8 },
              { id: 'c3', name: 'Runner 3', avatar: '/placeholder.svg', isAdmin: false, distanceContribution: 7.0 }
            ]
          },
          startDate: new Date(new Date().getTime() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          endDate: new Date(new Date().getTime() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          status: 'active'
        }
      };

      setCurrentUser(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          clubs: [...prev.clubs, newClub]
        };
      });

      setSelectedClub(newClub);
      setCurrentView('clubDetail');
    }
  };

  const value = {
    currentUser,
    currentView,
    selectedClub,
    selectedUser,
    setCurrentUser,
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
