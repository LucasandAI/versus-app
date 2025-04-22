
import { useState } from 'react';
import { Club, User } from './types';

export const useClubManagement = (
  currentUser: User | null, 
  setCurrentUser: (user: User | null | ((prev: User | null) => User | null)) => void
) => {
  const [selectedClub, setSelectedClub] = useState<Club | null>(null);

  const createClub = async (name: string, logo: string = '/placeholder.svg'): Promise<Club | null> => {
    if (!currentUser) {
      return null;
    }
    
    const newClub: Club = {
      id: Math.random().toString(36).substr(2, 9),
      name,
      logo,
      division: 'bronze',
      tier: 5,
      elitePoints: 0,
      bio: `Welcome to ${name}! We're a group of passionate runners looking to challenge ourselves and improve together.`,
      members: [
        {
          id: currentUser.id,
          name: currentUser.name,
          avatar: currentUser.avatar,
          isAdmin: true,
          distanceContribution: 0
        }
      ],
      matchHistory: []
    };

    setCurrentUser(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        clubs: [...prev.clubs, newClub]
      };
    });

    setSelectedClub(newClub);
    return newClub;
  };

  return {
    selectedClub,
    setSelectedClub,
    createClub
  };
};
