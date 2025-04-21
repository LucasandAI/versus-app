
import { useApp } from '@/context/AppContext';

export const useNavigation = () => {
  const { setCurrentView, setSelectedClub, setSelectedUser } = useApp();

  const navigateToUserProfile = (userId: string, userName: string, userAvatar: string = '/placeholder.svg') => {
    setSelectedUser({
      id: userId,
      name: userName,
      avatar: userAvatar,
      stravaConnected: true,
      clubs: []
    });
    setCurrentView('profile');
  };

  const navigateToClubDetail = (clubId: string, club: any) => {
    setSelectedClub(club);
    setCurrentView('clubDetail');
  };

  return {
    navigateToUserProfile,
    navigateToClubDetail
  };
};
