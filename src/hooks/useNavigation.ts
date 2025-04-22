
import { useApp } from '@/context/AppContext';
import { User, Club, ClubMember } from '@/types';

export const useNavigation = () => {
  const { setCurrentView, setSelectedClub, setSelectedUser, currentUser } = useApp();

  const navigateToUserProfile = (userId: string, userName: string, userAvatar: string = '/placeholder.svg') => {
    // When navigating to a user profile, check if this user is in any of the current user's clubs
    let userClubs: Club[] = [];
    
    if (currentUser) {
      // Find all clubs where this user is a member
      currentUser.clubs.forEach(club => {
        const isMember = club.members.some(member => member.id === userId);
        
        if (isMember) {
          // Find the member object to get their admin status
          const memberData = club.members.find(member => member.id === userId);
          
          // Add this club to the user's clubs list
          userClubs.push({
            ...club,
            // Update members list to reflect the correct admin status for this user
            members: club.members.map(member => {
              if (member.id === userId) {
                return {
                  ...member,
                  name: userName,
                  avatar: userAvatar,
                  isAdmin: memberData?.isAdmin || false
                };
              }
              return member;
            })
          });
        }
      });
    }

    // Create the user object with complete club data
    setSelectedUser({
      id: userId,
      name: userName,
      avatar: userAvatar,
      stravaConnected: true,
      clubs: userClubs
    });
    
    setCurrentView('profile');
  };

  const navigateToClubDetail = (clubId: string, club: any) => {
    setSelectedClub(club);
    setCurrentView('clubDetail');
  };

  return {
    navigateToUserProfile,
    navigateToClubDetail
  };
};
