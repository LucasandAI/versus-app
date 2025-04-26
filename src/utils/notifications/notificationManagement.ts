
import { supabase } from '@/integrations/supabase/client';

// Function to create a new notification
export const createNotification = async (notification: {
  user_id: string;
  type: 'invite' | 'join_request' | 'match_result' | 'match_start' | 'achievement';
  club_id: string;
  message?: string;
}) => {
  try {
    const { error } = await supabase
      .from('notifications')
      .insert({
        user_id: notification.user_id,
        type: notification.type,
        club_id: notification.club_id,
        message: notification.message || '',
        status: 'pending',
        read: false
      });
      
    if (error) {
      console.error('Error creating notification:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error in createNotification:', error);
    return false;
  }
};

// Function to update notification status
export const updateNotificationStatus = async (
  notificationId: string,
  status: 'accepted' | 'rejected' | 'read'
) => {
  try {
    const { error } = await supabase
      .from('notifications')
      .update({ status, read: true })
      .eq('id', notificationId);

    if (error) {
      console.error('Error updating notification:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in updateNotificationStatus:', error);
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
