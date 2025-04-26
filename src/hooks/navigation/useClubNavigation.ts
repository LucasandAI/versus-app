
import { useApp } from '@/context/AppContext';
import { toast } from "@/hooks/use-toast";
import { createNotification } from '@/utils/notification-queries';
import { Club } from '@/types';

export const useClubNavigation = () => {
  const { currentUser, setCurrentView, setSelectedClub } = useApp();

  const navigateToClub = (club: Partial<Club>) => {
    if (!club || !club.id) {
      console.error('[useClubNavigation] Cannot navigate to club, missing club ID');
      return;
    }

    console.log('[useClubNavigation] Navigating to club:', club.id);
    
    // Always set the selected club first with the data we have
    setSelectedClub({
      id: club.id,
      name: club.name || 'Loading club...',
      logo: club.logo || '/placeholder.svg',
      division: club.division || 'bronze',
      tier: club.tier || 5,
      elitePoints: club.elitePoints || 0,
      bio: club.bio || '',
      members: club.members || [],
      matchHistory: club.matchHistory || [],
      currentMatch: club.currentMatch || null
    } as Club);
    
    // Then navigate to the club detail view
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
    navigateToClub,
    handleLeaderboardClick,
    handleProfileClick,
    handleJoinRequest
  };
};
