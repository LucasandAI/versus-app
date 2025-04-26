
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { JoinRequest, Club, ClubMember } from '@/types';
import { toast } from '@/hooks/use-toast';

export const useJoinRequests = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [processingRequests, setProcessingRequests] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);
  const [requests, setRequests] = useState<JoinRequest[]>([]);

  const handleAcceptRequest = async (request: JoinRequest, club: Club) => {
    if (club.members.length >= 5) {
      toast({
        title: "Club is full",
        description: "This club already has the maximum number of members (5)",
        variant: "destructive"
      });
      return null;
    }
    
    setProcessingRequests(prev => ({ ...prev, [request.id]: true }));
    
    try {
      setError(null);

      // Begin transaction with Supabase
      // 1. Add user to club_members
      const { error: memberError } = await supabase
        .from('club_members')
        .insert([{
          club_id: request.clubId,
          user_id: request.userId,
          is_admin: false
        }]);

      if (memberError) throw memberError;

      // 2. Update request status to accepted
      const { error: requestError } = await supabase
        .from('club_requests')
        .update({ status: 'accepted' })
        .eq('id', request.id);

      if (requestError) throw requestError;

      // 3. Create notification for the user
      try {
        await supabase
          .from('notifications')
          .insert([{
            user_id: request.userId,
            club_id: request.clubId,
            type: 'join_request',
            status: 'accepted',
            message: `Your request to join ${club.name} has been accepted.`,
            read: false
          }]);
      } catch (notificationError) {
        console.error('Error creating notification:', notificationError);
        // Continue even if notification creation fails
      }

      // 4. Fetch the user's details to create a member object
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('name, avatar')
        .eq('id', request.userId)
        .single();

      if (userError) throw userError;

      // Create the new club member
      const newMember: ClubMember = {
        id: request.userId,
        name: userData.name || request.userName,
        avatar: userData.avatar || request.userAvatar,
        isAdmin: false,
        distanceContribution: 0
      };

      // Optimistically update the UI - remove the request
      setRequests(prevRequests => prevRequests.filter(r => r.id !== request.id));
      
      toast({
        title: "Request accepted",
        description: `${request.userName} has been added to the club`,
      });

      // Create updated club object with the new member
      const updatedClub = {
        ...club,
        members: [...club.members, newMember]
      };

      return updatedClub;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to accept request";
      setError(message);
      toast({
        title: "Error accepting request",
        description: message,
        variant: "destructive"
      });
      return null;
    } finally {
      setProcessingRequests(prev => ({ ...prev, [request.id]: false }));
    }
  };

  const handleDeclineRequest = async (request: JoinRequest) => {
    setProcessingRequests(prev => ({ ...prev, [request.id]: true }));
    
    try {
      setError(null);

      // 1. Update request status to declined
      const { error: requestError } = await supabase
        .from('club_requests')
        .update({ status: 'declined' })
        .eq('id', request.id);

      if (requestError) throw requestError;

      // 2. Create notification for the user
      try {
        await supabase
          .from('notifications')
          .insert([{
            user_id: request.userId,
            club_id: request.clubId,
            type: 'join_request',
            status: 'declined',
            message: `Your request to join the club has been declined.`,
            read: false
          }]);
      } catch (notificationError) {
        console.error('Error creating notification:', notificationError);
        // Continue even if notification creation fails
      }

      // Optimistically update the UI
      setRequests(prevRequests => prevRequests.filter(r => r.id !== request.id));
      
      toast({
        title: "Request declined",
        description: `Join request from ${request.userName} has been declined`,
      });
      
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to decline request";
      setError(message);
      toast({
        title: "Error declining request",
        description: message,
        variant: "destructive"
      });
      return false;
    } finally {
      setProcessingRequests(prev => ({ ...prev, [request.id]: false }));
    }
  };

  const fetchClubRequests = async (clubId: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase
        .from('club_requests')
        .select(`
          id,
          user_id,
          club_id,
          status,
          created_at,
          users:user_id (
            id, 
            name,
            avatar
          )
        `)
        .eq('club_id', clubId)
        .eq('status', 'pending');

      if (error) throw error;

      const formattedRequests: JoinRequest[] = data?.map(request => ({
        id: request.id,
        userId: request.user_id,
        clubId: request.club_id,
        userName: request.users?.name || 'Unknown',
        userAvatar: request.users?.avatar || '',
        createdAt: request.created_at
      })) || [];

      setRequests(formattedRequests);
      return formattedRequests;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to fetch join requests";
      setError(message);
      toast({
        title: "Error",
        description: "Could not load join requests",
        variant: "destructive"
      });
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    error,
    requests,
    setRequests,
    fetchClubRequests,
    handleAcceptRequest,
    handleDeclineRequest,
    isProcessing: (requestId: string) => !!processingRequests[requestId]
  };
};
