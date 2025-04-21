
import { useApp } from '@/context/AppContext';
import { Club, Division } from '@/types';
import { generateMatchHistoryFromDivision } from '@/utils/club/matchHistoryUtils';
import { getClubToJoin } from '@/utils/club';

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

    // For non-member clubs, get or create a complete club object
    const clubToJoin = getClubToJoin(
      club.id || '', 
      club.name || '', 
      currentUser?.clubs || []
    );

    // Ensure the club has match history
    if (!clubToJoin.matchHistory || clubToJoin.matchHistory.length === 0) {
      clubToJoin.matchHistory = generateMatchHistoryFromDivision(clubToJoin);
    }

    console.log("Navigating to non-member club:", clubToJoin);
    setSelectedClub(clubToJoin);
    setCurrentView('clubDetail');
  };

  return { navigateToClub };
};
