
import { useApp } from '@/context/AppContext';
import { toast } from "@/hooks/use-toast";
import { createNotification } from '@/utils/notification-queries';
import { Club } from '@/types';

export const useClubNavigation = () => {
  const { currentUser, setCurrentView, setSelectedClub } = useApp();

  const handleClubClick = (clubId: string) => {
    // Find the club in the user's clubs if possible
    const userClub = currentUser?.clubs.find(c => c.id === clubId);
    
    if (userClub) {
      console.log('[useClubNavigation] Found club in user clubs:', userClub);
      setSelectedClub(userClub);
    } else {
      console.log('[useClubNavigation] Club not in user clubs, setting ID only:', clubId);
      setSelectedClub({ id: clubId } as any);
    }
    
    setCurrentView('clubDetail');
  };
  
  const navigateToClub = (club: Partial<Club>) => {
    // Implementation already in the first file update
    // This is just a reference to ensure the signature is consistent
    console.log('[useClubNavigation] navigateToClub called with:', club);
    
    // We'll implement this in the first file update
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
    handleClubClick,
    navigateToClub,
    handleLeaderboardClick,
    handleProfileClick,
    handleJoinRequest
  };
};
