import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { JoinRequest, Club } from '@/types';
import { toast } from '@/hooks/use-toast';

export const useJoinRequests = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAcceptRequest = async (request: JoinRequest, club: Club) => {
    try {
      setIsLoading(true);
      setError(null);

      // Optimistically update the UI
      const updatedClub = {
        ...club,
        members: [
          ...club.members,
          {
            id: request.userId,
            name: request.userName,
            avatar: request.userAvatar,
            isAdmin: false,
            distanceContribution: 0
          }
        ]
      };

      // Add the user to the club_members table
      const { error: addMemberError } = await supabase
        .from('club_members')
        .insert([
          {
            club_id: club.id,
            user_id: request.userId,
            is_admin: false,
            joined_at: new Date().toISOString()
          }
        ]);

      if (addMemberError) {
        throw new Error(`Failed to add member: ${addMemberError.message}`);
      }

      // Delete the join request from the join_requests table
      const { error: deleteRequestError } = await supabase
        .from('join_requests')
        .delete()
        .eq('id', request.id);

      if (deleteRequestError) {
        throw new Error(`Failed to delete request: ${deleteRequestError.message}`);
      }

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

      // Delete the join request from the join_requests table
      const { error: deleteRequestError } = await supabase
        .from('join_requests')
        .delete()
        .eq('id', request.id);

      if (deleteRequestError) {
        throw new Error(`Failed to delete request: ${deleteRequestError.message}`);
      }

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
    handleAcceptRequest,
    handleDeclineRequest
  };
};
