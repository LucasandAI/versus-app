
import { useApp } from '@/context/AppContext';
import { getClubToJoin, isUserClubMember } from '@/utils/clubUtils';
import { useClubValidation } from './useClubValidation';
import { toast } from "@/hooks/use-toast";

export const useClubJoin = () => {
  const { currentUser, setCurrentUser } = useApp();
  const { validateClubJoin, validateClubRequest, validateExistingMembership } = useClubValidation();

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
    
    const isAlreadyMember = isUserClubMember(clubToJoin, currentUser.id);
    console.log('Is already member:', isAlreadyMember);
    
    if (!validateExistingMembership(isAlreadyMember, clubToJoin.name)) return;
    
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
    }
    localStorage.setItem('clubs', JSON.stringify(allClubs));
    
    const updatedUser = {
      ...currentUser,
      clubs: [...currentUser.clubs, clubToJoin]
    };
    
    setCurrentUser(updatedUser);
    localStorage.setItem('currentUser', JSON.stringify(updatedUser));
    
    toast({
      title: "Club Joined",
      description: `You have successfully joined ${clubToJoin.name}!`
    });
    
    // Update notifications
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
