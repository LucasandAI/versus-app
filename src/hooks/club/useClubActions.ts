
import { Club } from '@/types';
import { useApp } from '@/context/AppContext';
import { toast } from "@/hooks/use-toast";
import { handleNotification } from '@/utils/notificationUtils';

export const useClubActions = (club: Club) => {
  const { currentUser, setCurrentView, setCurrentUser, setSelectedClub } = useApp();

  const handleLeaveClub = (newAdminId?: string) => {
    if (!currentUser || !currentUser.clubs.some(c => c.id === club.id)) return;
    
    const updatedClub = { ...club };
    if (newAdminId) {
      updatedClub.members = club.members.map(member => ({
        ...member,
        isAdmin: member.id === newAdminId
      }));
    }
    
    updatedClub.members = updatedClub.members.filter(member => member.id !== currentUser.id);
    
    const updatedClubs = currentUser.clubs.filter(c => c.id !== club.id);
    const updatedUser = {
      ...currentUser,
      clubs: updatedClubs
    };

    try {
      const storedClubs = localStorage.getItem('clubs');
      const allClubs = storedClubs ? JSON.parse(storedClubs) : [];
      
      const clubIndex = allClubs.findIndex((c: any) => c.id === club.id);
      if (clubIndex !== -1) {
        allClubs[clubIndex] = updatedClub;
        localStorage.setItem('clubs', JSON.stringify(allClubs));
      }
    } catch (error) {
      console.error('Error updating clubs in localStorage:', error);
    }
    
    setCurrentUser(updatedUser);
    localStorage.setItem('currentUser', JSON.stringify(updatedUser));
    setSelectedClub(null);
    
    toast({
      title: "Left Club",
      description: `You have successfully left ${club.name}.`
    });
    
    setCurrentView('home');
    window.dispatchEvent(new CustomEvent('userDataUpdated'));
  };

  const handleJoinFromInvite = () => {
    if (!club || !currentUser) return;
    
    const notifications = JSON.parse(localStorage.getItem('notifications') || '[]');
    const invitation = notifications.find(
      (n: any) => n.type === 'invitation' && n.clubId === club.id
    );
    
    if (invitation) {
      handleNotification(invitation.id, 'delete');
    }
  };

  const handleDeclineInvite = () => {
    if (!club) return;
    
    const notifications = JSON.parse(localStorage.getItem('notifications') || '[]');
    const invitation = notifications.find(
      (n: any) => n.type === 'invitation' && n.clubId === club.id
    );
    
    if (invitation) {
      handleNotification(invitation.id, 'delete');
      toast({
        title: "Invite Declined",
        description: `You have declined the invitation to join ${club.name}.`
      });
    }
  };

  return {
    handleLeaveClub,
    handleJoinFromInvite,
    handleDeclineInvite
  };
};
