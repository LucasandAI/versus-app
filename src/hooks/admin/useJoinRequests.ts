
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { JoinRequest, Club, ClubMember } from '@/types';
import { toast } from '@/hooks/use-toast';
import { useApp } from '@/context/AppContext';

export const useJoinRequests = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [processingRequests, setProcessingRequests] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);
  const [requests, setRequests] = useState<JoinRequest[]>([]);
  const { setSelectedClub, currentUser, refreshCurrentUser } = useApp();

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
      
      console.log('[useJoinRequests] Accepting request:', request.id);

      // 1. Add user to club_members
      const { error: memberError } = await supabase
        .from('club_members')
        .insert([{
          club_id: request.clubId,
          user_id: request.userId,
          is_admin: false
        }]);

      if (memberError) {
        console.error('[useJoinRequests] Error adding member:', memberError);
        throw memberError;
      }
      
      console.log('[useJoinRequests] Successfully added user to club_members');

      // 2. Update the request status to 'accepted' instead of deleting
      const { error: requestError } = await supabase
        .from('club_requests')
        .update({ status: 'accepted' })
        .eq('id', request.id);

      if (requestError) {
        console.error('[useJoinRequests] Error updating request status:', requestError);
        throw requestError;
      }
      
      console.log('[useJoinRequests] Successfully updated request status to accepted');

      // 3. Delete any notifications related to this join request
      try {
        console.log('[useJoinRequests] Finding notifications related to request from user:', 
          request.userId, 'for club:', request.clubId);
        
        // Find all notifications related to this request - we need to search by both requesterId and userId
        const { data: notifications } = await supabase
          .from('notifications')
          .select('id')
          .eq('club_id', request.clubId)
          .eq('type', 'join_request');
          
        if (notifications && notifications.length > 0) {
          console.log('[useJoinRequests] Found notifications to delete:', notifications);
          
          // Delete all related notifications
          const { error: deleteError } = await supabase
            .from('notifications')
            .delete()
            .in('id', notifications.map(n => n.id));
            
          if (deleteError) {
            console.error('[useJoinRequests] Error deleting notifications:', deleteError);
          } else {
            console.log(`[useJoinRequests] Deleted ${notifications.length} related join request notifications`);
          }
        } else {
          console.log('[useJoinRequests] No notifications found for this request');
          
          // Try a different approach - check for notifications with the user ID in the data field
          const { data: dataNotifications } = await supabase
            .from('notifications')
            .select('id, data')
            .eq('club_id', request.clubId)
            .eq('type', 'join_request');
            
          if (dataNotifications && dataNotifications.length > 0) {
            console.log('[useJoinRequests] Found notifications with data:', dataNotifications);
            
            // Filter notifications that have the request.userId in their data
            const matchingNotifications = dataNotifications.filter(n => 
              n.data && 
              ((n.data.requesterId && n.data.requesterId === request.userId) || 
               (n.data.userId && n.data.userId === request.userId))
            );
            
            if (matchingNotifications.length > 0) {
              // Delete matching notifications
              const { error: deleteDataError } = await supabase
                .from('notifications')
                .delete()
                .in('id', matchingNotifications.map(n => n.id));
                
              if (deleteDataError) {
                console.error('[useJoinRequests] Error deleting data-matched notifications:', deleteDataError);
              } else {
                console.log(`[useJoinRequests] Deleted ${matchingNotifications.length} matching notifications`);
              }
            }
          }
        }
      } catch (notificationError) {
        console.error('[useJoinRequests] Error handling notifications:', notificationError);
        // Continue even if notification handling fails
      }

      // 4. Fetch the user's details to create a member object
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('name, avatar')
        .eq('id', request.userId)
        .single();

      if (userError) {
        console.error('[useJoinRequests] Error fetching user data:', userError);
        throw userError;
      }

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

      // Update the club in the global context
      setSelectedClub(updatedClub);
      
      // Refresh current user to update their clubs
      if (currentUser) {
        await refreshCurrentUser();
      }

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

      // Delete the request instead of updating status to 'rejected'
      const { error: requestError } = await supabase
        .from('club_requests')
        .delete()
        .eq('id', request.id);

      if (requestError) throw requestError;

      // Delete any notification related to this join request
      try {
        console.log('[useJoinRequests] Finding notifications related to declined request:', 
          request.userId, 'for club:', request.clubId);
          
        // Find notifications related to this request
        const { data: notifications } = await supabase
          .from('notifications')
          .select('id')
          .eq('club_id', request.clubId)
          .eq('type', 'join_request');
          
        if (notifications && notifications.length > 0) {
          console.log('[useJoinRequests] Found notifications to delete:', notifications);
          
          // Delete all related notifications
          const { error: deleteError } = await supabase
            .from('notifications')
            .delete()
            .in('id', notifications.map(n => n.id));
            
          if (deleteError) {
            console.error('[useJoinRequests] Error deleting notifications:', deleteError);
          } else {
            console.log(`[useJoinRequests] Deleted ${notifications.length} related notifications`);
          }
        } else {
          console.log('[useJoinRequests] No notifications found for this request');
          
          // Try a different approach - check for notifications with the user ID in the data field
          const { data: dataNotifications } = await supabase
            .from('notifications')
            .select('id, data')
            .eq('club_id', request.clubId)
            .eq('type', 'join_request');
            
          if (dataNotifications && dataNotifications.length > 0) {
            console.log('[useJoinRequests] Found notifications with data:', dataNotifications);
            
            // Filter notifications that have the request.userId in their data
            const matchingNotifications = dataNotifications.filter(n => 
              n.data && 
              ((n.data.requesterId && n.data.requesterId === request.userId) || 
               (n.data.userId && n.data.userId === request.userId))
            );
            
            if (matchingNotifications.length > 0) {
              // Delete matching notifications
              const { error: deleteDataError } = await supabase
                .from('notifications')
                .delete()
                .in('id', matchingNotifications.map(n => n.id));
                
              if (deleteDataError) {
                console.error('[useJoinRequests] Error deleting data-matched notifications:', deleteDataError);
              } else {
                console.log(`[useJoinRequests] Deleted ${matchingNotifications.length} matching notifications`);
              }
            }
          }
        }
      } catch (notificationError) {
        console.error('[useJoinRequests] Error handling notifications:', notificationError);
        // Continue even if notification handling fails
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

  const fetchClubRequests = useCallback(async (clubId: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('[useJoinRequests] Fetching club requests for club:', clubId);
      
      // Query club_requests table directly, but only fetch pending requests
      const { data: requestsData, error: requestsError } = await supabase
        .from('club_requests')
        .select('id, user_id, club_id, created_at, status')
        .eq('club_id', clubId)
        .eq('status', 'pending');

      if (requestsError) {
        console.error('[useJoinRequests] Error fetching club requests:', requestsError);
        throw requestsError;
      }

      console.log('[useJoinRequests] Found requests:', requestsData?.length || 0);

      if (!requestsData || requestsData.length === 0) {
        setRequests([]);
        return [];
      }

      // Now get user details for each request
      const formattedRequests: JoinRequest[] = [];
      
      for (const request of requestsData) {
        // Get user info separately
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('name, avatar')
          .eq('id', request.user_id)
          .single();
          
        if (userError) {
          console.error('[useJoinRequests] Error fetching user data:', userError);
          // Add with default values if user data can't be fetched
          formattedRequests.push({
            id: request.id,
            userId: request.user_id,
            clubId: request.club_id,
            userName: 'Unknown User',
            userAvatar: '',
            createdAt: request.created_at,
            status: request.status
          });
        } else {
          formattedRequests.push({
            id: request.id,
            userId: request.user_id,
            clubId: request.club_id,
            userName: userData.name || 'Unknown',
            userAvatar: userData.avatar || '',
            createdAt: request.created_at,
            status: request.status
          });
        }
      }

      console.log('[useJoinRequests] Formatted requests:', formattedRequests);
      setRequests(formattedRequests);
      return formattedRequests;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to fetch join requests";
      setError(message);
      console.error('[useJoinRequests] Error:', message);
      toast({
        title: "Error",
        description: "Could not load join requests",
        variant: "destructive"
      });
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

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
