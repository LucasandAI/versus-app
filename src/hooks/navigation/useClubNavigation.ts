
import { useState } from 'react';
import { useRouter } from 'react-router-dom';
import { useApp } from '@/context/AppContext';
import { toast } from 'sonner';
import { sendClubInvite } from '@/utils/clubInviteActions';

export const useClubNavigation = () => {
  const { setSelectedClub, setCurrentView } = useApp();
  const [isLoading, setIsLoading] = useState(false);

  const navigateToClub = (clubId: string, club: any) => {
    setSelectedClub(club);
    setCurrentView('clubDetail');
  };
  
  // Handle sending an invite to a user
  const handleSendInvite = async (userId: string, userName: string, clubId: string, clubName: string) => {
    try {
      setIsLoading(true);
      
      // Use the centralized sendClubInvite function that creates both the DB entry and notification
      const success = await sendClubInvite(clubId, clubName, userId, userName);
      
      return success;
    } catch (error) {
      console.error('[useClubNavigation] Error sending invite:', error);
      toast.error('Failed to send invitation');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    navigateToClub,
    handleSendInvite,
    isLoading
  };
};
