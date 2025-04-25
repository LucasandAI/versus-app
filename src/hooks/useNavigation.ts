
import { useUserNavigation } from './navigation/useUserNavigation';
import { useClubNavigation } from './navigation/useClubNavigation';
import { Club } from '@/types';
import { useApp } from '@/context/AppContext';

export const useNavigation = () => {
  const { navigateToUserProfile, isLoading: userNavLoading } = useUserNavigation();
  const { navigateToClub: navigateToClubDetail } = useClubNavigation();
  const { currentUser, setCurrentView, setSelectedUser } = useApp();
  
  const navigateToClub = (clubData: Club | Partial<Club>) => {
    if (!clubData) {
      console.error('[useNavigation] Cannot navigate to club, missing club data');
      return;
    }
    
    console.log('[useNavigation] Navigating to club with data:', clubData);
    navigateToClubDetail(clubData);
  };
  
  const handleClubClick = (clubId: string) => {
    // This is used for legacy code paths - it's better to use navigateToClub with full data
    if (!clubId) {
      console.error('[useNavigation] Cannot navigate to club detail, missing club ID');
      return;
    }
    
    console.log('[useNavigation] Navigating to club via ID only:', clubId);
    
    // Find the club in the user's clubs if possible
    const userClub = currentUser?.clubs.find(c => c.id === clubId);
    if (userClub) {
      navigateToClubDetail(userClub);
    } else {
      // If we don't have the full club data, at least pass the ID
      navigateToClubDetail({ id: clubId });
    }
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
    handleClubClick,
    navigateToClub,
    navigateToOwnProfile,
    isLoading: userNavLoading || false
  };
};
