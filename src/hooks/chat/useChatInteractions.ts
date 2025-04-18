
import { useApp } from '@/context/AppContext';
import { Club } from '@/types';

export const useChatInteractions = () => {
  const { setCurrentView, setSelectedClub, setSelectedUser } = useApp();

  const handleMatchClick = (selectedClub: Club | null) => {
    if (!selectedClub || !selectedClub.currentMatch) return;
    setSelectedClub(selectedClub);
    setCurrentView('clubDetail');
  };

  const handleSelectUser = (userId: string, userName: string, userAvatar: string = '/placeholder.svg') => {
    setSelectedUser({
      id: userId,
      name: userName,
      avatar: userAvatar,
      stravaConnected: true,
      clubs: []
    });
    setCurrentView('profile');
  };

  return {
    handleMatchClick,
    handleSelectUser
  };
};
