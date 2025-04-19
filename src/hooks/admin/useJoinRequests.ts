
import { useState } from 'react';
import { Club } from '@/types';
import { useApp } from '@/context/AppContext';
import { toast } from "@/hooks/use-toast";

interface JoinRequest {
  id: string;
  userId: string;
  name: string;
  avatar: string;
  requestDate: string;
}

export const useJoinRequests = (club: Club) => {
  const { setSelectedClub, setCurrentUser } = useApp();
  const [joinRequests, setJoinRequests] = useState<JoinRequest[]>([
    {
      id: 'req1',
      userId: 'u10',
      name: 'Alex Runner',
      avatar: '/placeholder.svg',
      requestDate: '2025-04-15T14:48:00.000Z',
    },
    {
      id: 'req2',
      userId: 'u11',
      name: 'Sam Speed',
      avatar: '/placeholder.svg',
      requestDate: '2025-04-16T09:23:00.000Z',
    },
    {
      id: 'req3',
      userId: 'u12',
      name: 'Jamie Jogger',
      avatar: '/placeholder.svg',
      requestDate: '2025-04-17T11:05:00.000Z',
    }
  ]);

  const isClubFull = club.members.length >= 5;

  const handleApprove = (request: JoinRequest) => {
    if (isClubFull) {
      toast({
        title: "Club is full",
        description: "The club has reached the maximum number of members.",
        variant: "destructive"
      });
      return;
    }
    
    const newMember = {
      id: request.userId,
      name: request.name,
      avatar: request.avatar,
      isAdmin: false
    };
    
    const updatedMembers = [...club.members, newMember];
    const updatedClub = { ...club, members: updatedMembers };
    
    setSelectedClub(updatedClub);
    
    setCurrentUser(prev => {
      if (!prev) return prev;
      
      const updatedClubs = prev.clubs.map(userClub => {
        if (userClub.id === club.id) {
          return { ...userClub, members: updatedMembers };
        }
        return userClub;
      });
      
      return { ...prev, clubs: updatedClubs };
    });
    
    setJoinRequests(prev => prev.filter(r => r.id !== request.id));
    
    toast({
      title: "Request Approved",
      description: `${request.name} has been added to the club.`,
    });
  };

  const handleDeny = (request: JoinRequest) => {
    setJoinRequests(prev => prev.filter(r => r.id !== request.id));
    
    toast({
      title: "Request Denied",
      description: `${request.name}'s request has been denied.`,
    });
  };

  return {
    joinRequests,
    isClubFull,
    handleApprove,
    handleDeny
  };
};
