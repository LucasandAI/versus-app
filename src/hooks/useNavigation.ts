
import { useUserNavigation } from './navigation/useUserNavigation';
import { useClubNavigation } from './navigation/useClubNavigation';

export const useNavigation = () => {
  const { navigateToUserProfile, isLoading: userLoading } = useUserNavigation();
  const { navigateToClubDetail, isLoading: clubLoading } = useClubNavigation();

  return {
    navigateToUserProfile,
    navigateToClubDetail,
    isLoading: userLoading || clubLoading
  };
};
