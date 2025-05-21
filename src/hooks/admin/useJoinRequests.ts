// Import required modules
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { JoinRequest } from '@/types';
import { toast } from '@/hooks/use-toast';

export const useJoinRequests = (clubId?: string) => {
  const [joinRequests, setJoinRequests] = useState<JoinRequest[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [processingIds, setProcessingIds] = useState<string[]>([]);

  const fetchRequests = async () => {
    if (!clubId) return;

    setIsLoading(true);
    setIsError(false);

    try {
      const { data, error } = await supabase
        .from('club_requests')
        .select(`
          id, 
          user_id, 
          created_at,
          status,
          user:user_id (
            id, 
            name, 
            avatar
          )
        `)
        .eq('club_id', clubId)
        .eq('status', 'PENDING')
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data) {
        const normalizedRequests = data.map(request => ({
          id: request.id,
          user_id: request.user_id,
          created_at: request.created_at,
          status: request.status,
          user: request.user || {
            id: request.user_id,
            name: 'Unknown User',
            avatar: null
          }
        }));
        setJoinRequests(normalizedRequests);
      }
    } catch (error) {
      setIsError(true);
      console.error('Error fetching join requests:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [clubId]);

  const approveRequest = async (requestId: string) => {
    if (!clubId) return;
    
    setProcessingIds(prev => [...prev, requestId]);
    
    try {
      // Optimistically remove from state
      const requestToApprove = joinRequests.find(req => req.id === requestId);
      setJoinRequests(prev => prev.filter(req => req.id !== requestId));
      
      // First, update the club_requests status to SUCCESS
      const { error: requestError } = await supabase
        .from('club_requests')
        .update({ status: 'SUCCESS' })
        .eq('id', requestId);
        
      if (requestError) {
        throw new Error(requestError.message);
      }
      
      // Next, add the user to the club
      if (requestToApprove) {
        const { error: memberError } = await supabase
          .from('club_members')
          .insert({
            club_id: clubId,
            user_id: requestToApprove.user_id,
            is_admin: false
          });
          
        if (memberError) throw new Error(memberError.message);
      }
      
      // Show success toast
      toast({
        title: "Request approved",
        description: "User has been added to the club",
      });
      
      // Refresh the list
      fetchRequests();
      
    } catch (error) {
      console.error('Error approving request:', error);
      
      // Update status with error state if something fails
      const { error: statusError } = await supabase
        .from('club_requests')
        .update({ status: 'REJECTED' })
        .eq('id', requestId);
      
      if (statusError) {
        console.error('Error updating request status:', statusError);
      }
      
      // Show error toast
      toast({
        title: "Error approving request",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive",
      });
      
      // Re-fetch to get accurate state
      fetchRequests();
    } finally {
      setProcessingIds(prev => prev.filter(id => id !== requestId));
    }
  };

  const rejectRequest = async (requestId: string) => {
    if (!clubId) return;
    
    setProcessingIds(prev => [...prev, requestId]);
    
    try {
      // Optimistically remove from state
      setJoinRequests(prev => prev.filter(req => req.id !== requestId));
      
      // Update the club_requests status to REJECTED
      const { error } = await supabase
        .from('club_requests')
        .update({ status: 'REJECTED' })
        .eq('id', requestId);
        
      if (error) throw error;
      
      // Show success toast
      toast({
        title: "Request rejected",
        description: "The request has been rejected",
      });
      
    } catch (error) {
      console.error('Error rejecting request:', error);
      
      // Show error toast
      toast({
        title: "Error rejecting request",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive",
      });
      
      // Re-fetch to get accurate state
      fetchRequests();
    } finally {
      setProcessingIds(prev => prev.filter(id => id !== requestId));
    }
  };

  return {
    joinRequests,
    isLoading,
    isError,
    processingIds,
    approveRequest,
    rejectRequest,
    fetchRequests
  };
};

export default useJoinRequests;
