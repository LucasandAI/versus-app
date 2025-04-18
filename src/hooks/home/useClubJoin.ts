
import { useApp } from '@/context/AppContext';
import { getClubToJoin } from '@/utils/clubUtils';
import { useClubValidation } from './useClubValidation';
import { toast } from "@/hooks/use-toast";

export const useClubJoin = () => {
  const { currentUser, setCurrentUser } = useApp();
  const { validateClubJoin, validateClubRequest } = useClubValidation();

  const handleRequestToJoin = (clubId: string, clubName: string) => {
    if (validateClubJoin(currentUser, clubName)) {
      validateClubRequest(clubName);
    }
  };

  const handleJoinClub = (clubId: string, clubName: string) => {
    if (!currentUser || !validateClubJoin(currentUser, clubName)) return;
    
    // Debug logging
    console.log('Joining club:', clubId, clubName);
    console.log('Current user clubs:', currentUser.clubs);
    
    // Check if user is already a member of this club by ID
    const isAlreadyMember = currentUser.clubs.some(club => club.id === clubId);
    console.log('Is already member:', isAlreadyMember);
    
    if (isAlreadyMember) {
      toast({
        title: "Already a Member",
        description: `You are already a member of ${clubName}.`,
        variant: "destructive"
      });
      return;
    }
    
    // Get clubs from localStorage or initialize empty array
    let allClubs = [];
    try {
      const storedClubs = localStorage.getItem('clubs');
      allClubs = storedClubs ? JSON.parse(storedClubs) : [];
    } catch (error) {
      console.error('Error parsing clubs from localStorage:', error);
      allClubs = [];
    }

    const clubToJoin = getClubToJoin(clubId, clubName, allClubs);
    
    if (!clubToJoin.members) {
      clubToJoin.members = [];
    }
    
    // Remove any existing instances of the user in the club members list to prevent duplicates
    clubToJoin.members = clubToJoin.members.filter(member => member.id !== currentUser.id);
    
    // Add user to club members
    clubToJoin.members.push({
      id: currentUser.id,
      name: currentUser.name,
      avatar: currentUser.avatar || '/placeholder.svg',
      isAdmin: false
    });
    
    // Update localStorage
    if (!allClubs.find((club: any) => club.id === clubId)) {
      allClubs.push(clubToJoin);
    } else {
      // Update existing club in the array
      const index = allClubs.findIndex((club: any) => club.id === clubId);
      if (index !== -1) {
        allClubs[index] = clubToJoin;
      }
    }
    localStorage.setItem('clubs', JSON.stringify(allClubs));
    
    const updatedUser = {
      ...currentUser,
      clubs: [...currentUser.clubs.filter(club => club.id !== clubId), clubToJoin]
    };
    
    setCurrentUser(updatedUser);
    localStorage.setItem('currentUser', JSON.stringify(updatedUser));
    
    toast({
      title: "Club Joined",
      description: `You have successfully joined ${clubToJoin.name}!`
    });
    
    // Update notifications - remove the invitation
    const notifications = JSON.parse(localStorage.getItem('notifications') || '[]');
    const updatedNotifications = notifications.filter(
      (n: any) => !(n.type === 'invitation' && n.clubId === clubId)
    );
    localStorage.setItem('notifications', JSON.stringify(updatedNotifications));
    
    // Dispatch events to update UI
    window.dispatchEvent(new CustomEvent('notificationsUpdated'));
    window.dispatchEvent(new CustomEvent('userDataUpdated'));
  };

  return {
    handleRequestToJoin,
    handleJoinClub
  };
};
