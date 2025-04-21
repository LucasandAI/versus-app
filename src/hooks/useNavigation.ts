
import { useApp } from '@/context/AppContext';
import { useNavigate } from 'react-router-dom';
import { slugifyClubName } from '@/utils/slugify';

export const useNavigation = () => {
  const { setCurrentView, setSelectedClub, setSelectedUser } = useApp();
  const navigate = useNavigate();

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
    const slug = club.slug || slugifyClubName(club.name);
    setSelectedClub(club);
    setCurrentView('clubDetail');
    navigate(`/clubs/${slug}`);
  };

  return {
    navigateToUserProfile,
    navigateToClubDetail
  };
};
