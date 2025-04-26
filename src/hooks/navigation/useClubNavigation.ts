
import { useApp } from '@/context/AppContext';
import { toast } from "@/hooks/use-toast";
import { createNotification } from '@/utils/notification-queries';
import { Club } from '@/types';
import { useNavigation } from '@/hooks/useNavigation';

export const useClubNavigation = () => {
  const { currentUser, setCurrentView, setSelectedClub } = useApp();

  const navigateToClub = (club: Partial<Club>) => {
    if (!club || !club.id) {
      console.error('[useClubNavigation] Cannot navigate to club, missing club ID');
      return;
    }

    console.log('[useClubNavigation] Navigating to club:', club.id);
    
    // Check if this is one of the user's clubs first (full data already available)
    const userClub = currentUser?.clubs?.find(c => c.id === club.id);
    
    if (userClub) {
      // Use the full club data from the current user's clubs
      setSelectedClub(userClub);
      setCurrentView('clubDetail');
    } else {
      // For non-member clubs, use the standard navigation which will fetch full data
      const { navigateToClubDetail } = useNavigation();
      navigateToClubDetail(club.id, club);
    }
  };

  const handleLeaderboardClick = () => {
    setCurrentView('leaderboard');
  };

  const handleProfileClick = () => {
    setCurrentView('profile');
  };

  const handleJoinRequest = async (clubId: string, clubName: string) => {
    try {
      const success = await createNotification({
        type: 'join_request',
        club_id: clubId,
        user_id: currentUser!.id,
        message: `wants to join ${clubName}`
      });

      if (success) {
        toast({
          title: "Join request sent",
          description: `Your request to join ${clubName} has been sent!`
        });
      }
    } catch (error) {
      console.error('Error sending join request:', error);
      toast({
        title: "Error",
        description: "Failed to send join request. Please try again.",
        variant: "destructive"
      });
    }
  };

  return {
    navigateToClub,
    handleLeaderboardClick,
    handleProfileClick,
    handleJoinRequest
  };
};
