
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

  const handleSelectClub = (clubId: string, clubName: string, clubMembers: any[] = []) => {
    const club = {
      id: clubId,
      name: clubName,
      logo: '/placeholder.svg',
      division: 'Gold' as const,
      tier: 3,
      members: clubMembers,
      matchHistory: []
    };
    
    setSelectedClub(club);
    setCurrentView('clubDetail');
  };

  return {
    handleMatchClick,
    handleSelectUser,
    handleSelectClub
  };
};
