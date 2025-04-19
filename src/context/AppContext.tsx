
import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
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
      currentMatch: {
        id: 'm1',
        homeClub: {
          id: '1',
          name: 'Weekend Warriors',
          logo: '/placeholder.svg',
          totalDistance: 62.5,
          members: [
            { id: '1', name: 'John Runner', avatar: '/placeholder.svg', isAdmin: true, distanceContribution: 15.3 },
            { id: '2', name: 'Jane Sprinter', avatar: '/placeholder.svg', isAdmin: false, distanceContribution: 12.7 },
            { id: '3', name: 'Bob Marathon', avatar: '/placeholder.svg', isAdmin: false, distanceContribution: 12.5 },
            { id: '4', name: 'Emma Jogger', avatar: '/placeholder.svg', isAdmin: false, distanceContribution: 11.2 },
            { id: '5', name: 'Tom Walker', avatar: '/placeholder.svg', isAdmin: false, distanceContribution: 10.8 },
          ]
        },
        awayClub: {
          id: '3',
          name: 'Running Rebels',
          logo: '/placeholder.svg',
          totalDistance: 57.2,
          members: [
            { id: '6', name: 'Sarah Swift', avatar: '/placeholder.svg', isAdmin: true, distanceContribution: 12.8 },
            { id: '7', name: 'Mike Miler', avatar: '/placeholder.svg', isAdmin: false, distanceContribution: 11.4 },
            { id: '8', name: 'Lisa Long', avatar: '/placeholder.svg', isAdmin: false, distanceContribution: 11.0 },
            { id: '9', name: 'David Dash', avatar: '/placeholder.svg', isAdmin: false, distanceContribution: 10.5 },
            { id: '10', name: 'Kate Speed', avatar: '/placeholder.svg', isAdmin: false, distanceContribution: 11.5 },
          ]
        },
        startDate: new Date(new Date().getTime() - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        endDate: new Date(new Date().getTime() + 4 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        status: 'active'
      },
      matchHistory: [
        {
          id: 'mh1',
          homeClub: {
            id: '1',
            name: 'Weekend Warriors',
            logo: '/placeholder.svg',
            totalDistance: 75.8,
            members: [
              { id: '1', name: 'John Runner', avatar: '/placeholder.svg', isAdmin: true, distanceContribution: 18.2 },
              { id: '2', name: 'Jane Sprinter', avatar: '/placeholder.svg', isAdmin: false, distanceContribution: 15.4 },
              { id: '3', name: 'Bob Marathon', avatar: '/placeholder.svg', isAdmin: false, distanceContribution: 16.8 },
              { id: '4', name: 'Emma Jogger', avatar: '/placeholder.svg', isAdmin: false, distanceContribution: 13.2 },
              { id: '5', name: 'Tom Walker', avatar: '/placeholder.svg', isAdmin: false, distanceContribution: 12.2 },
            ]
          },
          awayClub: {
            id: '5',
            name: 'Sprint Squad',
            logo: '/placeholder.svg',
            totalDistance: 68.3,
            members: [
              { id: '20', name: 'Alex Fast', avatar: '/placeholder.svg', isAdmin: true, distanceContribution: 15.2 },
              { id: '21', name: 'Maria Quick', avatar: '/placeholder.svg', isAdmin: false, distanceContribution: 14.8 },
              { id: '22', name: 'Steve Bolt', avatar: '/placeholder.svg', isAdmin: false, distanceContribution: 13.5 },
              { id: '23', name: 'Anna Dash', avatar: '/placeholder.svg', isAdmin: false, distanceContribution: 12.8 },
              { id: '24', name: 'Pete Flash', avatar: '/placeholder.svg', isAdmin: false, distanceContribution: 12.0 },
            ]
          },
          startDate: new Date(new Date().getTime() - 14 * 24 * 60 * 60 * 1000).toISOString(),
          endDate: new Date(new Date().getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'completed',
          winner: 'home'
        }
      ]
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
      currentMatch: {
        id: 'm2',
        homeClub: {
          id: '2',
          name: 'Road Runners',
          logo: '/placeholder.svg',
          totalDistance: 78.3,
          members: [
            { id: '1', name: 'John Runner', avatar: '/placeholder.svg', isAdmin: true, distanceContribution: 18.1 },
            { id: '7', name: 'Alice Sprint', avatar: '/placeholder.svg', isAdmin: false, distanceContribution: 15.4 },
            { id: '8', name: 'Charlie Run', avatar: '/placeholder.svg', isAdmin: false, distanceContribution: 16.8 },
            { id: '11', name: 'Olivia Pace', avatar: '/placeholder.svg', isAdmin: false, distanceContribution: 14.2 },
            { id: '12', name: 'Paul Path', avatar: '/placeholder.svg', isAdmin: false, distanceContribution: 13.8 },
          ]
        },
        awayClub: {
          id: '4',
          name: 'Trail Blazers',
          logo: '/placeholder.svg',
          totalDistance: 85.1,
          members: [
            { id: '13', name: 'Mark Move', avatar: '/placeholder.svg', isAdmin: true, distanceContribution: 18.3 },
            { id: '14', name: 'Eva Exercise', avatar: '/placeholder.svg', isAdmin: false, distanceContribution: 16.5 },
            { id: '15', name: 'Tom Track', avatar: '/placeholder.svg', isAdmin: false, distanceContribution: 17.3 },
            { id: '16', name: 'Susan Step', avatar: '/placeholder.svg', isAdmin: false, distanceContribution: 16.2 },
            { id: '17', name: 'Robert Run', avatar: '/placeholder.svg', isAdmin: false, distanceContribution: 16.8 },
          ]
        },
        startDate: new Date(new Date().getTime() - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        endDate: new Date(new Date().getTime() + 4 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        status: 'active'
      },
      matchHistory: [
        {
          id: 'mh2',
          homeClub: {
            id: '6',
            name: 'Elite Striders',
            logo: '/placeholder.svg',
            totalDistance: 92.4,
            members: [
              { id: '30', name: 'Chris Elite', avatar: '/placeholder.svg', isAdmin: true, distanceContribution: 20.5 },
              { id: '31', name: 'Sarah Speed', avatar: '/placeholder.svg', isAdmin: false, distanceContribution: 19.8 },
              { id: '32', name: 'Mike Power', avatar: '/placeholder.svg', isAdmin: false, distanceContribution: 18.5 },
              { id: '33', name: 'Lucy Swift', avatar: '/placeholder.svg', isAdmin: false, distanceContribution: 17.8 },
              { id: '34', name: 'Dan Dash', avatar: '/placeholder.svg', isAdmin: false, distanceContribution: 15.8 },
            ]
          },
          awayClub: {
            id: '2',
            name: 'Road Runners',
            logo: '/placeholder.svg',
            totalDistance: 85.6,
            members: [
              { id: '1', name: 'John Runner', avatar: '/placeholder.svg', isAdmin: true, distanceContribution: 19.2 },
              { id: '7', name: 'Alice Sprint', avatar: '/placeholder.svg', isAdmin: false, distanceContribution: 17.8 },
              { id: '8', name: 'Charlie Run', avatar: '/placeholder.svg', isAdmin: false, distanceContribution: 16.9 },
              { id: '11', name: 'Olivia Pace', avatar: '/placeholder.svg', isAdmin: false, distanceContribution: 16.2 },
              { id: '12', name: 'Paul Path', avatar: '/placeholder.svg', isAdmin: false, distanceContribution: 15.5 },
            ]
          },
          startDate: new Date(new Date().getTime() - 21 * 24 * 60 * 60 * 1000).toISOString(),
          endDate: new Date(new Date().getTime() - 14 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'completed',
          winner: 'away'
        }
      ]
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

  // Update selected club when currentUser changes
  useEffect(() => {
    if (selectedClub && currentUser) {
      // Find the updated club in the currentUser's clubs
      const updatedClub = currentUser.clubs.find(club => club.id === selectedClub.id);
      if (updatedClub) {
        setSelectedClub(updatedClub);
      } else {
        // If the club is no longer in the user's clubs (e.g., after leaving it), clear it
        setSelectedClub(null);
      }
    }
  }, [currentUser, selectedClub]);

  // Update selected user when current user changes
  useEffect(() => {
    if (selectedUser && currentUser && selectedUser.id === currentUser.id) {
      // If the selected user is the current user, update it to reflect changes
      setSelectedUser(currentUser);
    }
  }, [currentUser, selectedUser]);

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
        bio: `Welcome to ${name}! We're a group of passionate runners looking to challenge ourselves and improve together.`,
        members: [
          {
            id: currentUser.id,
            name: currentUser.name,
            avatar: currentUser.avatar,
            isAdmin: true
          }
        ],
        matchHistory: []
        // New clubs with less than 5 members don't get a match
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

  // Helper function to update user info in all clubs
  const updateUserInfo = (user: User) => {
    if (!user) return user;
    
    // Create a copy of all clubs and update the current user's info in each club
    const updatedClubs = user.clubs.map(club => {
      // Update members list
      const updatedMembers = club.members.map(member => {
        if (member.id === user.id) {
          return {
            ...member,
            name: user.name,
            avatar: user.avatar
          };
        }
        return member;
      });
      
      // Update currentMatch info if it exists
      let updatedCurrentMatch = club.currentMatch;
      if (updatedCurrentMatch) {
        // Update home club members
        if (updatedCurrentMatch.homeClub.id === club.id) {
          const updatedHomeMembers = updatedCurrentMatch.homeClub.members.map(member => {
            if (member.id === user.id) {
              return {
                ...member,
                name: user.name,
                avatar: user.avatar
              };
            }
            return member;
          });
          
          updatedCurrentMatch = {
            ...updatedCurrentMatch,
            homeClub: {
              ...updatedCurrentMatch.homeClub,
              members: updatedHomeMembers
            }
          };
        }
        
        // Also check and update away club if user is there
        if (updatedCurrentMatch.awayClub.members.some(m => m.id === user.id)) {
          const updatedAwayMembers = updatedCurrentMatch.awayClub.members.map(member => {
            if (member.id === user.id) {
              return {
                ...member,
                name: user.name,
                avatar: user.avatar
              };
            }
            return member;
          });
          
          updatedCurrentMatch = {
            ...updatedCurrentMatch,
            awayClub: {
              ...updatedCurrentMatch.awayClub,
              members: updatedAwayMembers
            }
          };
        }
      }
      
      return {
        ...club,
        members: updatedMembers,
        currentMatch: updatedCurrentMatch
      };
    });
    
    return {
      ...user,
      clubs: updatedClubs
    };
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
