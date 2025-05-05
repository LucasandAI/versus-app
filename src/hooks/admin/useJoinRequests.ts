import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { JoinRequest } from '@/types';
import { createNotification } from '@/utils/notifications/notificationUtils';

export const useJoinRequests = (clubId: string) => {
  const [joinRequests, setJoinRequests] = useState<JoinRequest[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch join requests for the club
  const fetchJoinRequests = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('club_requests')
        .select('*')
        .eq('club_id', clubId)
        .eq('status', 'PENDING');

      if (error) {
        console.error('[useJoinRequests] Error fetching join requests:', error);
        setError(error.message);
        return;
      }

      if (data) {
        const requestsWithUserDetails = await Promise.all(
          data.map(async (request) => {
            const { data: user, error: userError } = await supabase
              .from('users')
              .select('name, avatar')
              .eq('id', request.user_id)
              .single();

            if (userError) {
              console.error('[useJoinRequests] Error fetching user details:', userError);
              return {
                ...request,
                userName: 'Unknown User',
                userAvatar: '/placeholder.svg',
              };
            }

            return {
              id: request.id,
              userId: request.user_id,
              clubId: request.club_id,
              userName: user.name,
              userAvatar: user.avatar || '/placeholder.svg',
              createdAt: request.created_at,
              status: request.status,
            };
          })
        );
        setJoinRequests(requestsWithUserDetails);
      }
    } catch (err) {
      console.error('[useJoinRequests] Unexpected error:', err);
      setError('Failed to load join requests.');
    } finally {
      setIsLoading(false);
    }
  };

  // Refresh join requests
  const refreshJoinRequests = async () => {
    await fetchJoinRequests();
  };

  useEffect(() => {
    if (clubId) {
      fetchJoinRequests();
    }
  }, [clubId]);

  // Accept a join request
  const acceptJoinRequest = async (requestId: string) => {
    try {
      setIsLoading(true);
      
      // Get the request data
      const { data: requestData, error: requestError } = await supabase
        .from('club_requests')
        .select('user_id, club_id')
        .eq('id', requestId)
        .single();
        
      if (requestError) {
        console.error('[useJoinRequests] Error fetching request data:', requestError);
        return null;
      }
      
      const { user_id, club_id } = requestData;
      
      // Check if user is already a member of the club
      const { data: existingMembership } = await supabase
        .from('club_members')
        .select('*')
        .eq('user_id', user_id)
        .eq('club_id', club_id)
        .single();
        
      if (existingMembership) {
        console.log('[useJoinRequests] User already a member of this club');
        
        // Update the request status to accepted
        await supabase
          .from('club_requests')
          .update({ status: 'SUCCESS' })
          .eq('id', requestId);
        
        return;
      }
      
      // Begin transaction
      // 1. Add user to club members
      const { error: membershipError } = await supabase
        .from('club_members')
        .insert({
          user_id,
          club_id,
          is_admin: false,
        });
        
      if (membershipError) {
        console.error('[useJoinRequests] Error adding user to club:', membershipError);
        return null;
      }
      
      // 2. Update request status
      const { error: updateError } = await supabase
        .from('club_requests')
        .update({ status: 'SUCCESS' })
        .eq('id', requestId);
        
      if (updateError) {
        console.error('[useJoinRequests] Error updating request status:', updateError);
        return null;
      }
      
      // 3. Update club member count
      const { error: clubUpdateError } = await supabase.rpc('increment_club_member_count', { club_id });
      if (clubUpdateError) {
        console.error('[useJoinRequests] Error updating club member count:', clubUpdateError);
      }

      // 4. Create notification for the user
      await createNotification({
        userId: user_id,
        clubId: club_id,
        type: 'request_accepted',
        title: 'Join Request Accepted',
        message: 'Your request to join the club has been accepted!',
      });

      // Refresh join requests and trigger club membership change event
      await refreshJoinRequests();
      window.dispatchEvent(new CustomEvent('clubMembershipChanged', { detail: { clubId: club_id } }));
      
      return true;
    } catch (error) {
      console.error('[useJoinRequests] Error accepting join request:', error);
      return null;
    } finally {
      setIsLoading(false);
    }
  };
  
  // Reject a join request
  const rejectJoinRequest = async (requestId: string) => {
    try {
      setIsLoading(true);
      
      // Get the request data for notification
      const { data: requestData, error: requestError } = await supabase
        .from('club_requests')
        .select('user_id, club_id')
        .eq('id', requestId)
        .single();
        
      if (requestError) {
        console.error('[useJoinRequests] Error fetching request data:', requestError);
        return null;
      }
      
      // Delete the request instead of rejecting it
      // Since the schema only allows 'pending' and 'accepted', we'll just remove rejected requests
      const { error: deleteError } = await supabase
        .from('club_requests')
        .delete()
        .eq('id', requestId);
        
      if (deleteError) {
        console.error('[useJoinRequests] Error deleting request:', deleteError);
        return null;
      }
      
      // Create notification for the user that their request was rejected
      await createNotification({
        userId: requestData.user_id, 
        type: 'activity',
        title: 'Join Request Rejected',
        message: 'Your request to join the club was not accepted.',
      });

      // Refresh join requests
      await refreshJoinRequests();
      
      return true;
    } catch (error) {
      console.error('[useJoinRequests] Error rejecting join request:', error);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    joinRequests,
    isLoading,
    error,
    acceptJoinRequest,
    rejectJoinRequest,
    refreshJoinRequests,
  };
};
