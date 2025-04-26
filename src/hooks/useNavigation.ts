
import { useUserNavigation } from './navigation/useUserNavigation';
import { useClubNavigation } from './navigation/useClubNavigation';
import { Club } from '@/types';
import { useApp } from '@/context/AppContext';

export const useNavigation = () => {
  const { navigateToUserProfile, isLoading: userNavLoading } = useUserNavigation();
  const { navigateToClub } = useClubNavigation();
  const { currentUser, setCurrentView, setSelectedUser, setSelectedClub } = useApp();
  
  // Improved navigation to club with proper setting of selected club
  const navigateToClubDetail = (clubId: string, clubData?: Partial<Club>) => {
    if (!clubId) {
      console.error('[useNavigation] Cannot navigate to club detail, missing club ID');
      return;
    }
    
    console.log('[useNavigation] Navigating to club detail:', clubId, clubData);
    
    // First set the selected club with the data we have
    if (clubData) {
      setSelectedClub({
        id: clubId,
        name: clubData.name || 'Loading...',
        logo: clubData.logo || '/placeholder.svg',
        division: clubData.division || 'bronze',
        tier: clubData.tier || 5,
        elitePoints: clubData.elitePoints || 0,
        members: clubData.members || [],
        matchHistory: clubData.matchHistory || [],
        bio: clubData.bio || ''
      } as Club);
    } else {
      // If no club data provided, set a minimal object with ID so the detail page can load it
      setSelectedClub({ 
        id: clubId, 
        name: 'Loading...',
        logo: '/placeholder.svg',
        division: 'bronze',
        tier: 5,
        elitePoints: 0,
        members: [],
        matchHistory: []
      } as Club);
    }
    
    // Then navigate to the club detail view
    setCurrentView('clubDetail');
  };
  
  // Convenience method to navigate to your own profile
  const navigateToOwnProfile = () => {
    if (currentUser) {
      setSelectedUser(currentUser);
      setCurrentView('profile');
    }
  };
  
  return {
    navigateToUserProfile,
    navigateToClubDetail,
    navigateToClub,
    navigateToOwnProfile,
    isLoading: userNavLoading || false
  };
};
