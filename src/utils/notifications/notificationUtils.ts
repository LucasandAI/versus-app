
import { supabase } from '@/integrations/supabase/client';

export interface NotificationData {
  userId: string;
  clubId?: string;
  type: string;
  title?: string;
  message: string;
  data?: any;
}

/**
 * Create a notification in the database
 * @param notification The notification data to create
 * @returns boolean indicating success or failure
 */
export const createNotification = async (notification: NotificationData): Promise<boolean> => {
  if (!notification.userId) {
    console.error('[createNotification] User ID is required');
    return false;
  }
  
  try {
    const { error } = await supabase
      .from('notifications')
      .insert({
        user_id: notification.userId,
        club_id: notification.clubId || null,
        type: notification.type,
        title: notification.title || '',
        message: notification.message,
        data: notification.data || {},
        read: false,
        status: 'pending'
      });
      
    if (error) {
      console.error('[createNotification] Error creating notification:', error);
      return false;
    }
    
    console.log('[createNotification] Notification created successfully');
    
    // Dispatch event to update UI
    window.dispatchEvent(new CustomEvent('notificationsUpdated'));
    
    return true;
  } catch (error) {
    console.error('[createNotification] Unexpected error creating notification:', error);
    return false;
  }
};
