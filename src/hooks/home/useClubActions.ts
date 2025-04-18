
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
    
    let clubToJoin = clubs.find((club: any) => club.id === clubId);
    
    if (!clubToJoin) {
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
    
    if (clubToJoin && !clubToJoin.members.some((member: any) => member.id === currentUser.id)) {
      clubToJoin.members.push({
        id: currentUser.id,
        name: currentUser.name,
        avatar: currentUser.avatar || '/placeholder.svg',
        isAdmin: false
      });
      
      localStorage.setItem('clubs', JSON.stringify(clubs));
      
      const updatedUser = {
        ...currentUser,
        clubs: [...currentUser.clubs, clubToJoin]
      };
      
      setCurrentUser(updatedUser);
      
      localStorage.setItem('currentUser', JSON.stringify(updatedUser));
      
      toast({
        title: "Club Joined",
        description: `You have successfully joined ${clubName}!`
      });
    } else {
      toast({
        title: "Already a Member",
        description: `You are already a member of ${clubName}.`,
        variant: "destructive"
      });
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
    name: 'Urban Pacers',
    division: 'Bronze',
    tier: 5,
    members: 2
  }
];
