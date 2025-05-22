
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export const acceptJoinRequest = async (userId: string, clubId: string, userName: string): Promise<boolean> => {
  try {
    // Update the request status
    const { error: updateError } = await supabase
      .from('club_requests')
      .update({ status: 'SUCCESS' })
      .eq('user_id', userId)
      .eq('club_id', clubId);

    if (updateError) {
      console.error('[acceptJoinRequest] Error updating request status:', updateError);
      return false;
    }

    // Add the user to the club
    const { error: memberError } = await supabase
      .from('club_members')
      .insert({
        club_id: clubId,
        user_id: userId,
        is_admin: false
      });

    if (memberError) {
      console.error('[acceptJoinRequest] Error adding user to club:', memberError);
      return false;
    }

    // Delete notifications related to this join request
    try {
      // Find notifications with type 'join_request' for this club where the data contains this user's ID
      const { data: notifications, error: notificationError } = await supabase
        .from('notifications')
        .select('id, data')
        .eq('club_id', clubId)
        .eq('type', 'join_request');
        
      if (notificationError) {
        console.error('[acceptJoinRequest] Error finding join request notifications:', notificationError);
      } else if (notifications && notifications.length > 0) {
        // Filter to only get notifications related to this user
        const notificationsToDelete = notifications.filter(notification => {
          // Safely check if data exists and contains userId matching this user
          if (!notification.data) return false;
          
          const data = notification.data as Record<string, any>;
          return (
            (data.userId && data.userId === userId) || 
            (data.requesterId && data.requesterId === userId)
          );
        });
        
        if (notificationsToDelete.length > 0) {
          const notificationIds = notificationsToDelete.map(n => n.id);
          
          console.log(`[acceptJoinRequest] Deleting ${notificationIds.length} notifications:`, notificationIds);
          
          // Delete the notifications
          const { error: deleteError } = await supabase
            .from('notifications')
            .delete()
            .in('id', notificationIds);
            
          if (deleteError) {
            console.error('[acceptJoinRequest] Error deleting notifications:', deleteError);
          } else {
            console.log('[acceptJoinRequest] Successfully deleted join request notifications');
          }
        }
      }
    } catch (error) {
      console.error('[acceptJoinRequest] Error handling notification deletion:', error);
    }

    // Dispatch event to refresh user data
    window.dispatchEvent(new Event('userDataUpdated'));
    
    return true;
  } catch (error) {
    console.error('[acceptJoinRequest] Error:', error);
    return false;
  }
};

export const denyJoinRequest = async (userId: string, clubId: string): Promise<boolean> => {
  try {
    // Update the request status to REJECTED instead of using delete
    const { error } = await supabase
      .from('club_requests')
      .update({ status: 'REJECTED' })
      .eq('user_id', userId)
      .eq('club_id', clubId);

    if (error) {
      console.error('[denyJoinRequest] Error updating join request status:', error);
      return false;
    }

    // Delete notifications related to this join request
    try {
      // Find notifications with type 'join_request' for this club where the data contains this user's ID
      const { data: notifications, error: notificationError } = await supabase
        .from('notifications')
        .select('id, data')
        .eq('club_id', clubId)
        .eq('type', 'join_request');
        
      if (notificationError) {
        console.error('[denyJoinRequest] Error finding join request notifications:', notificationError);
      } else if (notifications && notifications.length > 0) {
        // Filter to only get notifications related to this user
        const notificationsToDelete = notifications.filter(notification => {
          // Safely check if data exists and contains userId matching this user
          if (!notification.data) return false;
          
          const data = notification.data as Record<string, any>;
          return (
            (data.userId && data.userId === userId) || 
            (data.requesterId && data.requesterId === userId)
          );
        });
        
        if (notificationsToDelete.length > 0) {
          const notificationIds = notificationsToDelete.map(n => n.id);
          
          console.log(`[denyJoinRequest] Deleting ${notificationIds.length} notifications:`, notificationIds);
          
          // Delete the notifications
          const { error: deleteError } = await supabase
            .from('notifications')
            .delete()
            .in('id', notificationIds);
            
          if (deleteError) {
            console.error('[denyJoinRequest] Error deleting notifications:', deleteError);
          } else {
            console.log('[denyJoinRequest] Successfully deleted join request notifications');
          }
        }
      }
    } catch (error) {
      console.error('[denyJoinRequest] Error handling notification deletion:', error);
    }

    // Show success toast
    toast({
      title: "Request Denied",
      description: "The join request has been denied."
    });
    
    return true;
  } catch (error) {
    console.error('[denyJoinRequest] Error:', error);
    return false;
  }
};
