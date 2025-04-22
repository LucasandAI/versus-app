
import { useUserNavigation } from './navigation/useUserNavigation';
import { useClubNavigation } from './navigation/useClubNavigation';
import { Club } from '@/types';

export const useNavigation = () => {
  const { navigateToUserProfile, isLoading: userNavLoading } = useUserNavigation();
  const { handleClubClick } = useClubNavigation();
  
  const navigateToClub = (clubData: Club | Partial<Club>) => {
    if ('id' in clubData && clubData.id) {
      handleClubClick(clubData.id);
    }
  };
  
  const navigateToClubDetail = (clubId: string, clubData?: Partial<Club>) => {
    handleClubClick(clubId);
  };
  
  return {
    navigateToUserProfile,
    navigateToClubDetail,
    navigateToClub,
    isLoading: userNavLoading || false
  };
};
