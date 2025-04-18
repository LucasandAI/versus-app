
import { useState } from 'react';
import { Club } from '@/types';
import { useApp } from '@/context/AppContext';
import { toast } from "@/hooks/use-toast";

const MAX_CLUBS_PER_USER = 3;

export const useClubActions = () => {
  const { currentUser, setCurrentUser } = useApp();
  const [searchDialogOpen, setSearchDialogOpen] = useState(false);
  const [createClubDialogOpen, setCreateClubDialogOpen] = useState(false);

  const handleRequestToJoin = (clubId: string, clubName: string) => {
    const userClubs = currentUser?.clubs || [];
    const isAtClubCapacity = userClubs.length >= MAX_CLUBS_PER_USER;
    
    if (isAtClubCapacity) {
      toast({
        title: "Club Limit Reached",
        description: `You can join a maximum of ${MAX_CLUBS_PER_USER} clubs.`,
        variant: "destructive"
      });
      return;
    }
    
    toast({
      title: "Request Sent",
      description: `Your request to join ${clubName} has been sent.`,
    });
  };

  const handleJoinClub = (clubId: string, clubName: string) => {
    if (!currentUser) return;
    
    // Fixed check for existing membership - exact string comparison for clubId
    const isAlreadyMember = currentUser.clubs.some(club => club.id === clubId);
    
    if (isAlreadyMember) {
      toast({
        title: "Already a Member",
        description: `You are already a member of ${clubName}.`,
        variant: "destructive"
      });
      return;
    }
    
    if (currentUser.clubs.length >= MAX_CLUBS_PER_USER) {
      toast({
        title: "Club Limit Reached",
        description: `You can join a maximum of ${MAX_CLUBS_PER_USER} clubs.`,
        variant: "destructive"
      });
      return;
    }
    
    const allClubs = localStorage.getItem('clubs') || '[]';
    const clubs = JSON.parse(allClubs);
    
    // Find the club or create it if it doesn't exist
    let clubToJoin = clubs.find((club: any) => club.id === clubId);
    
    if (!clubToJoin) {
      // Try to find the club in available clubs first
      const mockClub = availableClubs.find(club => club.id === clubId);
      
      if (mockClub) {
        clubToJoin = {
          id: mockClub.id,
          name: mockClub.name,
          logo: '/placeholder.svg',
          division: mockClub.division,
          tier: mockClub.tier,
          members: [],
          currentMatch: null,
          matchHistory: []
        };
        
        clubs.push(clubToJoin);
      } else {
        // Create a new club if not found in available clubs
        clubToJoin = {
          id: clubId,
          name: clubName,
          logo: '/placeholder.svg',
          division: 'Bronze',
          tier: 3,
          members: [],
          currentMatch: null,
          matchHistory: []
        };
        
        clubs.push(clubToJoin);
      }
    }
    
    // Now we have a club object, add the user as a member
    if (clubToJoin) {
      // Double check that user isn't already a member
      const userIsMember = clubToJoin.members.some((member: any) => member.id === currentUser.id);
      
      if (!userIsMember) {
        // Add user to club members
        clubToJoin.members.push({
          id: currentUser.id,
          name: currentUser.name,
          avatar: currentUser.avatar || '/placeholder.svg',
          isAdmin: false
        });
        
        // Save updated clubs to localStorage
        localStorage.setItem('clubs', JSON.stringify(clubs));
        
        // Update user's club membership
        const updatedUser = {
          ...currentUser,
          clubs: [...currentUser.clubs, clubToJoin]
        };
        
        setCurrentUser(updatedUser);
        localStorage.setItem('currentUser', JSON.stringify(updatedUser));
        
        // Show success message
        toast({
          title: "Club Joined",
          description: `You have successfully joined ${clubName}!`
        });
        
        // Remove the invitation notification
        const notifications = JSON.parse(localStorage.getItem('notifications') || '[]');
        const updatedNotifications = notifications.filter(
          (n: any) => !(n.type === 'invitation' && n.clubId === clubId)
        );
        localStorage.setItem('notifications', JSON.stringify(updatedNotifications));
        
        // Dispatch event to update notifications
        const event = new CustomEvent('notificationsUpdated');
        window.dispatchEvent(event);
      } else {
        toast({
          title: "Already a Member",
          description: `You are already a member of ${clubName}.`,
          variant: "destructive"
        });
      }
    }
  };

  return {
    searchDialogOpen,
    setSearchDialogOpen,
    createClubDialogOpen,
    setCreateClubDialogOpen,
    handleRequestToJoin,
    handleJoinClub,
    availableClubs
  };
};

// Define available clubs mock data within the hook file
const availableClubs = [
  {
    id: 'ac1',
    name: 'Morning Joggers',
    division: 'Silver',
    tier: 3,
    members: 3
  },
  {
    id: 'ac2',
    name: 'Hill Climbers',
    division: 'Gold',
    tier: 2,
    members: 4
  },
  {
    id: 'ac3',
    name: 'Urban Pacers', // This is different from 'Urban Runners' in the notification
    division: 'Bronze',
    tier: 5,
    members: 2
  }
];
