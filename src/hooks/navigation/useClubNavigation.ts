import { useApp } from '@/context/AppContext';
import { useRouter } from 'next/navigation';
import { toast } from "@/hooks/use-toast";
import { createNotification } from '@/utils/notification-queries';

export const useClubNavigation = () => {
  const { currentUser, setCurrentView, setSelectedClub } = useApp();
  const router = useRouter();

  const handleClubClick = (clubId: string) => {
    setSelectedClub({ id: clubId } as any);
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
