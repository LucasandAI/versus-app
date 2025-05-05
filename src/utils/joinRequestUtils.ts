
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

/**
 * Accepts a join request - adds user to club, updates request status, and deletes notifications
 */
export const acceptJoinRequest = async (
  requesterId: string,
  clubId: string,
  clubName: string
): Promise<boolean> => {
  try {
    console.log('[joinRequestUtils] Accepting join request:', { 
      requesterId, 
      clubId,
      clubName
    });
    
    // First check if the club already has 5 members (maximum)
    const { data: clubData, error: clubError } = await supabase
      .from('clubs')
      .select('member_count')
      .eq('id', clubId)
      .single();
      
    if (clubError) {
      console.error('[joinRequestUtils] Error checking club members:', clubError);
      throw clubError;
    }
    
    if (clubData && clubData.member_count >= 5) {
      toast.error("Club is full (5/5 members). Cannot add more members.");
      return false;
    }
    
    // Add the requesting user to the club members
    const { error: joinError } = await supabase
      .from('club_members')
      .insert({
        user_id: requesterId,
        club_id: clubId,
        is_admin: false
      });
      
    if (joinError) {
      console.error('[joinRequestUtils] Error adding user to club:', joinError);
      throw joinError;
    }
    
    // Update request status to accepted
    const { error: requestError } = await supabase
      .from('club_requests')
      .update({ status: 'SUCCESS' })
      .eq('user_id', requesterId)
      .eq('club_id', clubId);
      
    if (requestError) {
      console.error('[joinRequestUtils] Error updating request status:', requestError);
      throw requestError;
    }
    
    // Delete all notifications related to this join request
    await deleteJoinRequestNotifications(requesterId, clubId);
    
    // Show success message
    toast.success(`User has been added to ${clubName}`);
    
    // Trigger refresh of user data
    try {
      // We dispatch an event for components to handle refresh
      window.dispatchEvent(new CustomEvent('userDataUpdated'));
    } catch (refreshError) {
      console.error('[joinRequestUtils] Error refreshing user data:', refreshError);
    }
    
    return true;
  } catch (error) {
    console.error("[joinRequestUtils] Error accepting join request:", error);
    toast.error("Failed to accept join request");
    return false;
  }
};

/**
 * Denies a join request - deletes the request and related notifications
 */
export const denyJoinRequest = async (
  requesterId: string,
  clubId: string
): Promise<boolean> => {
  try {
    console.log('[joinRequestUtils] Denying join request:', { 
      requesterId, 
      clubId 
    });
    
    // Delete the club request
    const { error } = await supabase
      .from('club_requests')
      .delete()
      .eq('user_id', requesterId)
      .eq('club_id', clubId);
      
    if (error) {
      console.error('[joinRequestUtils] Error deleting request:', error);
      throw error;
    }
    
    // Delete all notifications related to this join request
    await deleteJoinRequestNotifications(requesterId, clubId);
    
    toast.success("Request denied");
    
    // Trigger refresh of user data
    try {
      window.dispatchEvent(new CustomEvent('userDataUpdated'));
    } catch (refreshError) {
      console.error('[joinRequestUtils] Error refreshing user data:', refreshError);
    }
    
    return true;
  } catch (error) {
    console.error("[joinRequestUtils] Error denying join request:", error);
    toast.error("Failed to deny join request");
    return false;
  }
};

/**
 * Deletes all notifications related to a join request
 */
export const deleteJoinRequestNotifications = async (
  requesterId: string,
  clubId: string
): Promise<void> => {
  try {
    console.log('[joinRequestUtils] Deleting notifications for request:', {
      requesterId,
      clubId
    });
    
    // Get all notifications related to this join request
    const { data: notifications, error: fetchError } = await supabase
      .from('notifications')
      .select('id, data')
      .eq('club_id', clubId)
      .eq('type', 'join_request');
      
    if (fetchError) {
      console.error('[joinRequestUtils] Error fetching notifications:', fetchError);
      return;
    }
    
    if (!notifications || notifications.length === 0) {
      console.log('[joinRequestUtils] No notifications found for this request');
      return;
    }
    
    console.log('[joinRequestUtils] Found notifications:', notifications);
    
    // Filter notifications that match the requester ID
    const matchingNotifications = notifications.filter(notification => {
      // Handle different data structures
      const data = notification.data;
      if (!data) return false;
      
      if (typeof data === 'object') {
        // Check if data is an object with requesterId or userId property
        const objData = data as Record<string, any>;
        return (
          (objData.requesterId && objData.requesterId === requesterId) ||
          (objData.userId && objData.userId === requesterId)
        );
      }
      
      return false;
    });
    
    if (matchingNotifications.length === 0) {
      console.log('[joinRequestUtils] No matching notifications found');
      return;
    }
    
    console.log('[joinRequestUtils] Deleting matching notifications:', 
      matchingNotifications.length,
      matchingNotifications.map(n => n.id)
    );
    
    // Delete the matching notifications
    const { error: deleteError } = await supabase
      .from('notifications')
      .delete()
      .in('id', matchingNotifications.map(n => n.id));
      
    if (deleteError) {
      console.error('[joinRequestUtils] Error deleting notifications:', deleteError);
      return;
    }
    
    console.log(`[joinRequestUtils] Successfully deleted ${matchingNotifications.length} notifications`);
    
    // Dispatch an event to notify components to update their notification lists
    window.dispatchEvent(new CustomEvent('notificationsUpdated'));
  } catch (error) {
    console.error('[joinRequestUtils] Error deleting notifications:', error);
  }
};
