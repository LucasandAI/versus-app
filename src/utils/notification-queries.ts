import { Division } from '@/types';
import { supabase } from '@/integrations/supabase/client';

// Function to fetch notifications for a user
export const fetchUserNotifications = async (userId: string) => {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
    
  if (error) {
    console.error('Error fetching notifications:', error);
    return [];
  }
  
  return data || [];
};

// Function to mark a notification as read
export const markNotificationAsRead = async (notificationId: string) => {
  const { error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('id', notificationId);
    
  if (error) {
    console.error('Error marking notification as read:', error);
    return false;
  }
  
  return true;
};

// Function to create a new notification
export const createNotification = async (notification: {
  user_id: string;
  type: string;
  title: string;
  description: string;
  data?: any;
}) => {
  const { error } = await supabase
    .from('notifications')
    .insert([
      {
        ...notification,
        read: false,
        created_at: new Date().toISOString()
      }
    ]);
    
  if (error) {
    console.error('Error creating notification:', error);
    return false;
  }
  
  return true;
};

// Function to create a join request notification
export const createJoinRequestNotification = async (
  adminId: string,
  requesterId: string,
  requesterName: string,
  clubId: string,
  clubName: string
) => {
  return createNotification({
    user_id: adminId,
    type: 'join_request',
    title: 'New Join Request',
    description: `${requesterName} wants to join ${clubName}`,
    data: {
      requesterId,
      clubId
    }
  });
};

// Function to create a match result notification
export const createMatchResultNotification = async (
  userId: string,
  matchId: string,
  clubName: string,
  opponentName: string,
  isWin: boolean,
  newDivision?: Division,
  promotedOrDemoted?: 'promoted' | 'demoted'
) => {
  const division = 'bronze'; // Changed from 'Bronze' to 'bronze'
  
  let title = isWin ? 'Match Won!' : 'Match Lost';
  let description = `${clubName} ${isWin ? 'defeated' : 'lost to'} ${opponentName}`;
  
  if (promotedOrDemoted) {
    description += ` and was ${promotedOrDemoted} to ${newDivision || division}`;
  }
  
  return createNotification({
    user_id: userId,
    type: 'match_result',
    title,
    description,
    data: {
      matchId,
      isWin,
      newDivision,
      promotedOrDemoted
    }
  });
};

// Function to delete all notifications for a user
export const deleteAllUserNotifications = async (userId: string) => {
  const { error } = await supabase
    .from('notifications')
    .delete()
    .eq('user_id', userId);
    
  if (error) {
    console.error('Error deleting notifications:', error);
    return false;
  }
  
  return true;
};

// Function to mark all notifications as read for a user
export const markAllNotificationsAsRead = async (userId: string) => {
  const { error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('user_id', userId)
    .eq('read', false);
    
  if (error) {
    console.error('Error marking all notifications as read:', error);
    return false;
  }
  
  return true;
};
