
import { useState } from 'react';
import { Club, Division } from '@/types';
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
    
    // Debug logging
    console.log('Joining club:', clubId, clubName);
    console.log('Current user clubs:', currentUser.clubs);
    
    // Check if user is already a member by comparing club IDs
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
    
    if (currentUser.clubs.length >= MAX_CLUBS_PER_USER) {
      toast({
        title: "Club Limit Reached",
        description: `You can join a maximum of ${MAX_CLUBS_PER_USER} clubs.`,
        variant: "destructive"
      });
      return;
    }
    
    // Get clubs from localStorage or initialize empty array
    let allClubs = [];
    try {
      const storedClubs = localStorage.getItem('clubs');
      if (storedClubs) {
        allClubs = JSON.parse(storedClubs);
      }
    } catch (error) {
      console.error('Error parsing clubs from localStorage:', error);
      allClubs = [];
    }
    
    // Try to find the club in our available clubs list first
    const mockClub = availableClubs.find(club => club.id === clubId);
    let clubToJoin;
    
    if (mockClub) {
      // Check if this club already exists in the stored clubs
      clubToJoin = allClubs.find((club: any) => club.id === clubId);
      
      if (!clubToJoin) {
        // Create a new club based on the mock club
        clubToJoin = {
          id: mockClub.id,
          name: mockClub.name,
          logo: '/placeholder.svg',
          division: mockClub.division as Division,
          tier: mockClub.tier,
          members: [],
          currentMatch: null,
          matchHistory: []
        };
        
        allClubs.push(clubToJoin);
      }
    } else {
      // If not found in available clubs, use the provided name
      clubToJoin = allClubs.find((club: any) => club.id === clubId);
      
      if (!clubToJoin) {
        // Create a completely new club
        clubToJoin = {
          id: clubId,
          name: clubName,
          logo: '/placeholder.svg',
          division: 'Bronze' as Division,
          tier: 3,
          members: [],
          currentMatch: null,
          matchHistory: []
        };
        
        allClubs.push(clubToJoin);
      }
    }
    
    // Add user to club members if not already a member
    if (!clubToJoin.members) {
      clubToJoin.members = [];
    }
    
    // Check if user is already in this specific club's members array
    const isInClubMembers = clubToJoin.members.some((member: any) => member.id === currentUser.id);
    if (isInClubMembers) {
      toast({
        title: "Already a Member",
        description: `You are already a member of ${clubToJoin.name}.`,
        variant: "destructive"
      });
      return;
    }
    
    // Add user to club members
    clubToJoin.members.push({
      id: currentUser.id,
      name: currentUser.name,
      avatar: currentUser.avatar || '/placeholder.svg',
      isAdmin: false
    });
    
    // Save updated clubs to localStorage
    localStorage.setItem('clubs', JSON.stringify(allClubs));
    
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
      description: `You have successfully joined ${clubToJoin.name}!`
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
    
    // Dispatch an event to let all components know user data has been updated
    const userEvent = new CustomEvent('userDataUpdated');
    window.dispatchEvent(userEvent);
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
    name: 'Urban Pacers', 
    division: 'Bronze',
    tier: 5,
    members: 2
  }
];
