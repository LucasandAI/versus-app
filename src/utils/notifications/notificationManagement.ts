
import { supabase } from '@/integrations/supabase/client';

// Function to create a new notification
export const createNotification = async (notification: {
  user_id: string;
  type: 'invite' | 'join_request' | 'match_result' | 'match_start' | 'achievement' | 'request_accepted';
  club_id: string;
  title?: string;
  description?: string;
  message?: string;
  data?: any;
}) => {
  // Keep this function as is - it's a generic utility
  // The removal is from specific usages for join_request type
  try {
    const { error } = await supabase
      .from('notifications')
      .insert({
        user_id: notification.user_id,
        type: notification.type,
        club_id: notification.club_id,
        title: notification.title || '',
        description: notification.description || '',
        message: notification.message || '',
        data: notification.data || {},
        read: false,
        created_at: new Date().toISOString()
      });
      
    if (error) {
      console.error('Error creating notification:', error);
      return false;
    }
    
    // Trigger notification update event
    window.dispatchEvent(new CustomEvent('notificationsUpdated'));
    return true;
  } catch (error) {
    console.error('Error in createNotification:', error);
    return false;
  }
};

// Function to update notification status
export const updateNotificationStatus = async (
  notificationId: string,
  status: 'read'
) => {
  try {
    const { error } = await supabase
      .from('notifications')
      .update({ read: status === 'read' })
      .eq('id', notificationId);

    if (error) {
      console.error('Error updating notification:', error);
      return false;
    }

    // Trigger notification update event
    window.dispatchEvent(new CustomEvent('notificationsUpdated'));
    return true;
  } catch (error) {
    console.error('Error in updateNotificationStatus:', error);
    return false;
  }
};

// Function to update a club join request status
export const updateClubJoinRequest = async (
  userId: string, 
  clubId: string, 
  status: 'accepted' | 'rejected'
): Promise<boolean> => {
  try {
    if (status === 'accepted') {
      // Update to accepted
      const { error } = await supabase
        .from('club_requests')
        .update({ status })
        .eq('user_id', userId)
        .eq('club_id', clubId)
        .eq('status', 'pending');

      if (error) {
        console.error('Error updating join request:', error);
        return false;
      }
    } else {
      // Delete the request instead of updating to rejected
      const { error } = await supabase
        .from('club_requests')
        .delete()
        .eq('user_id', userId)
        .eq('club_id', clubId);

      if (error) {
        console.error('Error deleting join request:', error);
        return false;
      }
    }

    return true;
  } catch (error) {
    console.error('Error in updateClubJoinRequest:', error);
    return false;
  }
};

// Function to delete a club join request
export const deleteClubJoinRequest = async (userId: string, clubId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('club_requests')
      .delete()
      .eq('user_id', userId)
      .eq('club_id', clubId);
      
    if (error) {
      console.error('Error deleting join request:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error in deleteClubJoinRequest:', error);
    return false;
  }
};
