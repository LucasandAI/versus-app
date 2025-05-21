
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { JoinRequest } from '@/types';

// Function to check if a user has pending join requests for a club
export const hasPendingJoinRequest = async (userId: string, clubId: string): Promise<boolean> => {
  try {
    console.log('[hasPendingJoinRequest] Checking for user:', userId, 'club:', clubId);
    
    const { data, error } = await supabase
      .from('club_requests')
      .select('*')
      .eq('user_id', userId)
      .eq('club_id', clubId)
      .eq('status', 'PENDING')
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No record found - this is not an error for our use case
        return false;
      }
      console.error('[hasPendingJoinRequest] Error checking pending join requests:', error);
      return false;
    }

    return !!data;
  } catch (error) {
    console.error('[hasPendingJoinRequest] Error:', error);
    return false;
  }
};

// Function to fetch join requests for a club
export const fetchClubJoinRequests = async (clubId: string): Promise<JoinRequest[]> => {
  try {
    console.log('[fetchClubJoinRequests] Fetching join requests for club:', clubId);
    
    const { data: requestsData, error: requestsError } = await supabase
      .from('club_requests')
      .select('id, user_id, club_id, created_at, status')
      .eq('club_id', clubId)
      .eq('status', 'PENDING');

    if (requestsError) {
      console.error('[fetchClubJoinRequests] Error fetching join requests:', requestsError);
      return [];
    }

    console.log('[fetchClubJoinRequests] Found requests:', requestsData?.length || 0);
    
    if (!requestsData || requestsData.length === 0) {
      return [];
    }

    const results: JoinRequest[] = [];
    
    for (const request of requestsData) {
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('name, avatar')
        .eq('id', request.user_id)
        .single();
        
      if (userError) {
        console.error('[fetchClubJoinRequests] Error fetching user data:', userError);
      }
      
      results.push({
        id: request.id,
        userId: request.user_id,
        clubId: request.club_id,
        userName: userData?.name || 'Unknown User',
        userAvatar: userData?.avatar || '',
        createdAt: request.created_at,
        status: request.status === 'ERROR' ? 'REJECTED' : request.status
      } as JoinRequest);
    }
    
    console.log('[fetchClubJoinRequests] Formatted requests:', results);
    return results;
  } catch (error) {
    console.error('[fetchClubJoinRequests] Error:', error);
    return [];
  }
};

// Function to accept a join request
export const acceptJoinRequest = async (
  requestId: string,
  clubId: string,
  userId: string,
  onSuccess?: () => void,
  onError?: () => void
) => {
  try {
    // First, update the request status to SUCCESS
    const { error: updateError } = await supabase
      .from('club_requests')
      .update({ status: 'SUCCESS' })
      .eq('id', requestId);
      
    if (updateError) {
      throw updateError;
    }
    
    // Then, add the user to the club
    const { error: memberError } = await supabase
      .from('club_members')
      .insert({
        club_id: clubId,
        user_id: userId,
        is_admin: false
      });
      
    if (memberError) {
      throw memberError;
    }
    
    // Show success message
    toast({
      title: "Request accepted",
      description: "User has been added to the club"
    });
    
    // Call success callback if provided
    if (onSuccess) onSuccess();
    
    return true;
  } catch (error) {
    console.error('Error accepting join request:', error);
    
    // Try to set the request back to PENDING or to REJECTED if that fails
    const { error: resetError } = await supabase
      .from('club_requests')
      .update({ status: 'REJECTED' })
      .eq('id', requestId);
      
    if (resetError) {
      console.error('Error resetting join request status:', resetError);
    }
    
    // Show error message
    toast({
      title: "Error accepting request",
      description: "Could not add user to club. Please try again.",
      variant: "destructive"
    });
    
    // Call error callback if provided
    if (onError) onError();
    
    return false;
  }
};
