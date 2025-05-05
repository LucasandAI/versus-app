
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { JoinRequest, RequestStatus, Club } from '@/types';
import { useApp } from '@/context/AppContext';
import { toast } from 'sonner';
import { acceptJoinRequest, denyJoinRequest } from '@/utils/joinRequestUtils';

export const useJoinRequests = () => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const [requests, setRequests] = useState<JoinRequest[]>([]);
  const [processingRequests, setProcessingRequests] = useState<Record<string, boolean>>({});
  
  const { currentUser } = useApp();

  // Function to check if a request is currently being processed
  const isProcessing = (requestId: string): boolean => {
    return processingRequests[requestId] === true;
  };

  // Function to fetch all join requests for a club
  const fetchClubRequests = useCallback(async (clubId: string): Promise<JoinRequest[]> => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('[useJoinRequests] Fetching join requests for club:', clubId);
      
      // Query for pending requests for this club
      const { data: requestsData, error: requestsError } = await supabase
        .from('club_requests')
        .select('id, user_id, club_id, created_at, status')
        .eq('club_id', clubId)
        .eq('status', 'pending');

      if (requestsError) {
        throw requestsError;
      }

      console.log('[useJoinRequests] Found requests:', requestsData?.length || 0);
      
      if (!requestsData || requestsData.length === 0) {
        setRequests([]);
        return [];
      }

      // Fetch user details for each request
      const joinRequests: JoinRequest[] = [];
      
      for (const request of requestsData) {
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('name, avatar')
          .eq('id', request.user_id)
          .single();
          
        if (userError) {
          console.error('[useJoinRequests] Error fetching user details:', userError);
          continue;
        }
        
        joinRequests.push({
          id: request.id,
          userId: request.user_id,
          clubId: request.club_id,
          userName: userData?.name || 'Unknown User',
          userAvatar: userData?.avatar || '',
          createdAt: request.created_at,
          status: request.status as RequestStatus
        });
      }
      
      console.log('[useJoinRequests] Formatted requests:', joinRequests);
      setRequests(joinRequests);
      return joinRequests;
    } catch (error) {
      console.error('[useJoinRequests] Error:', error);
      setError(error as Error);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Handle accepting a join request
  const handleAcceptRequest = async (request: JoinRequest, club: Club): Promise<boolean> => {
    if (isProcessing(request.id)) {
      toast.info("Please wait, request is already being processed");
      return false;
    }
    
    setProcessingRequests(prev => ({
      ...prev,
      [request.id]: true
    }));
    
    try {
      // Call the utility function to accept the request
      const success = await acceptJoinRequest(
        request.userId,
        request.clubId,
        club.name
      );
      
      if (success) {
        // Remove the request from the list
        setRequests(prev => prev.filter(r => r.id !== request.id));
        return true;
      }
      return false;
    } catch (error) {
      console.error('[useJoinRequests] Error accepting request:', error);
      toast.error("Error accepting request");
      return false;
    } finally {
      setProcessingRequests(prev => ({
        ...prev,
        [request.id]: false
      }));
    }
  };

  // Handle declining a join request
  const handleDeclineRequest = async (request: JoinRequest): Promise<boolean> => {
    if (isProcessing(request.id)) {
      toast.info("Please wait, request is already being processed");
      return false;
    }
    
    setProcessingRequests(prev => ({
      ...prev,
      [request.id]: true
    }));
    
    try {
      // Call the utility function to deny the request
      const success = await denyJoinRequest(
        request.userId,
        request.clubId
      );
      
      if (success) {
        // Remove the request from the list
        setRequests(prev => prev.filter(r => r.id !== request.id));
        return true;
      }
      return false;
    } catch (error) {
      console.error('[useJoinRequests] Error declining request:', error);
      toast.error("Error declining request");
      return false;
    } finally {
      setProcessingRequests(prev => ({
        ...prev,
        [request.id]: false
      }));
    }
  };

  return {
    isLoading,
    error,
    requests,
    fetchClubRequests,
    handleAcceptRequest,
    handleDeclineRequest,
    isProcessing
  };
};
