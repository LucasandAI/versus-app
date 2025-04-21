
import { useApp } from '@/context/AppContext';
import { Club, Division } from '@/types';
import { generateMatchHistoryFromDivision } from '@/utils/club/matchGenerationUtils';

export const useClubNavigation = () => {
  const { setCurrentView, setSelectedClub, currentUser } = useApp();

  const navigateToClub = (club: Partial<Club>) => {
    // Check if it's one of the user's clubs first
    const userClub = currentUser?.clubs.find(c => c.id === club.id);
    
    if (userClub) {
      setSelectedClub(userClub);
      setCurrentView('clubDetail');
      return;
    }

    // For non-member clubs, create a complete club object with generated match history
    const completeClub: Club = {
      id: club.id || '',
      name: club.name || '',
      logo: club.logo || '/placeholder.svg',
      division: club.division as Division || 'Bronze',
      tier: club.tier || 5,
      members: club.members || [],
      matchHistory: []
    };

    // Generate match history for the club
    completeClub.matchHistory = generateMatchHistoryFromDivision(completeClub);

    setSelectedClub(completeClub);
    setCurrentView('clubDetail');
  };

  return { navigateToClub };
};
