
import { useApp } from '@/context/AppContext';
import { Club } from '@/types';
import { useNavigation } from '@/hooks/useNavigation';

export const useChatInteractions = () => {
  const { setCurrentView, setSelectedClub } = useApp();
  const { navigateToUserProfile, navigateToClub } = useNavigation();

  const handleMatchClick = (selectedClub: Club | null) => {
    if (!selectedClub || !selectedClub.currentMatch) return;
    setSelectedClub(selectedClub);
    setCurrentView('clubDetail');
  };

  const handleSelectUser = (userId: string, userName: string, userAvatar: string = '/placeholder.svg') => {
    navigateToUserProfile(userId, userName, userAvatar);
  };
  
  const handleClubClick = (club: Club) => {
    navigateToClub(club);
  };

  return {
    handleMatchClick,
    handleSelectUser,
    handleClubClick
  };
};
