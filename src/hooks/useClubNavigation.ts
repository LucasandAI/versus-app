
import { useApp } from '@/context/AppContext';
import { Club, Division } from '@/types';
import { generateMatchHistoryFromDivision } from '@/utils/club/matchHistoryUtils';
import { getClubToJoin } from '@/utils/club';
import { supabase } from '@/integrations/supabase/client';
import { ensureDivision } from '@/utils/club/leagueUtils';

export const useClubNavigation = () => {
  const { setCurrentView, setSelectedClub, currentUser, refreshCurrentUser } = useApp();

  const navigateToClub = async (club: Partial<Club>) => {
    console.log('[useClubNavigation] Navigating to club:', club.id, club.name);
    
    // Check if it's one of the user's clubs first
    const userClub = currentUser?.clubs.find(c => c.id === club.id);
    
    if (userClub) {
      console.log('[useClubNavigation] Found club in user clubs:', userClub);
      setSelectedClub(userClub);
      setCurrentView('clubDetail');
      return;
    }

    // If not found in local data, try to fetch fresh club data from database
    // This handles the case where user was just added to a club but local data hasn't refreshed yet
    if (club.id && refreshCurrentUser) {
      console.log('[useClubNavigation] Club not found locally, refreshing user data...');
      try {
        const refreshedUser = await refreshCurrentUser();
        const refreshedUserClub = refreshedUser?.clubs.find(c => c.id === club.id);
        
        if (refreshedUserClub) {
          console.log('[useClubNavigation] Found club after refresh:', refreshedUserClub);
          setSelectedClub(refreshedUserClub);
          setCurrentView('clubDetail');
          return;
        }
      } catch (error) {
        console.error('[useClubNavigation] Error refreshing user data:', error);
      }
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
