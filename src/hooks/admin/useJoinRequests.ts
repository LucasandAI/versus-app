
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { JoinRequest, Club, ClubMember } from '@/types';
import { toast } from '@/hooks/use-toast';

export const useJoinRequests = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [requests, setRequests] = useState<JoinRequest[]>([]);

  const handleAcceptRequest = async (request: JoinRequest, club: Club) => {
    try {
      setIsLoading(true);
      setError(null);

      // Create the new club member
      const newMember: ClubMember = {
        id: request.userId,
        name: request.userName,
        avatar: request.userAvatar,
        isAdmin: false,
        distanceContribution: 0
      };

      // Optimistically update the UI
      const updatedClub = {
        ...club,
        members: [...club.members, newMember]
      };

      // Since we don't have the join_requests table in Supabase yet, this is a placeholder
      // In a real implementation, this would add the user to club_members and delete the request
      // For now, just show a toast notification
      
      // Remove the request from the list
      setRequests(prevRequests => prevRequests.filter(r => r.id !== request.id));
      
      toast({
        title: "Request accepted",
        description: `${request.userName} has been added to the club`,
      });

      return updatedClub;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to accept request";
      setError(message);
      toast({
        title: "Error accepting request",
        description: message,
        variant: "destructive"
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeclineRequest = async (request: JoinRequest) => {
    try {
      setIsLoading(true);
      setError(null);

      // Since we don't have the join_requests table in Supabase yet, this is a placeholder
      // In a real implementation, this would delete the request from the join_requests table
      
      // Remove the request from the list
      setRequests(prevRequests => prevRequests.filter(r => r.id !== request.id));
      
      toast({
        title: "Request declined",
        description: `Join request from ${request.userName} has been declined`,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to decline request";
      setError(message);
      toast({
        title: "Error declining request",
        description: message,
        variant: "destructive"
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    error,
    requests,
    setRequests,
    handleAcceptRequest,
    handleDeclineRequest
  };
};
