
import { useUserNavigation } from './navigation/useUserNavigation';
import { useClubNavigation } from './navigation/useClubNavigation';
import { Club } from '@/types';

export const useNavigation = () => {
  const { navigateToUserProfile, isLoading: userNavLoading } = useUserNavigation();
  const { navigateToClubDetail, isLoading: clubNavLoading } = useClubNavigation();
  
  const navigateToClub = (clubData: Club | Partial<Club>) => {
    if ('id' in clubData && clubData.id) {
      navigateToClubDetail(clubData.id, clubData);
    }
  };
  
  return {
    navigateToUserProfile,
    navigateToClubDetail,
    navigateToClub,
    isLoading: userNavLoading || clubNavLoading
  };
};
