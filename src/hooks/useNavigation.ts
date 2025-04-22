
import { useUserNavigation } from './navigation/useUserNavigation';
import { useClubNavigation } from './navigation/useClubNavigation';
import { Club } from '@/types';

export const useNavigation = () => {
  const { navigateToUserProfile, isLoading: userNavLoading } = useUserNavigation();
  const { handleClubClick, handleJoinRequest } = useClubNavigation();
  
  const navigateToClub = (clubData: Club | Partial<Club>) => {
    if ('id' in clubData && clubData.id) {
      console.log('[useNavigation] Navigating to club:', clubData.id);
      handleClubClick(clubData.id);
    } else {
      console.error('[useNavigation] Cannot navigate to club, missing ID:', clubData);
    }
  };
  
  const navigateToClubDetail = (clubId: string, clubData?: Partial<Club>) => {
    console.log('[useNavigation] Navigating to club detail:', clubId);
    handleClubClick(clubId);
  };
  
  return {
    navigateToUserProfile,
    navigateToClubDetail,
    navigateToClub,
    handleJoinRequest,
    isLoading: userNavLoading || false
  };
};
