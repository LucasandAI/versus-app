import { useApp } from '@/context/AppContext';
import { toast } from "@/components/ui/use-toast";
import { createNotification } from '@/utils/notification-queries';

export const useClubNavigation = () => {
  const { currentUser, setCurrentView, setSelectedClub } = useApp();

  const handleClubClick = (clubId: string) => {
    // Find if this is a club the user is a member of
    const userClub = currentUser?.clubs.find(c => c.id === clubId);
    
    if (userClub) {
      // If user is a member, we already have the complete club data
      console.log("Navigating to user's club with complete data:", userClub.name);
      setSelectedClub(userClub);
    } else {
      // Otherwise just use the ID and let the detail page fetch the data
      console.log("Navigating to club with ID only:", clubId);
      setSelectedClub({ id: clubId } as any);
    }
    
    setCurrentView('clubDetail');
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
    handleLeaderboardClick,
    handleProfileClick,
    handleJoinRequest
  };
};
