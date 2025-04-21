
import { useApp } from '@/context/AppContext';
import { Club } from '@/types';

export const useClubNavigation = () => {
  const { setCurrentView, setSelectedClub, currentUser } = useApp();

  const navigateToClub = (club: Club | Partial<Club>) => {
    // If it's one of the user's clubs, we have full data
    const userClub = currentUser?.clubs.find(c => c.id === club.id);
    if (userClub) {
      setSelectedClub(userClub);
      setCurrentView('clubDetail');
      return;
    }

    // For other clubs, create a minimal club object
    const minimalClub: Club = {
      id: club.id || '',
      name: club.name || '',
      logo: club.logo || '/placeholder.svg',
      division: club.division || 'Bronze',
      tier: club.tier || 5,
      members: club.members || [],
      matchHistory: []
    };

    setSelectedClub(minimalClub);
    setCurrentView('clubDetail');
  };

  return { navigateToClub };
};
