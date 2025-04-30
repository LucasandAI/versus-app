
import { supabase } from '@/integrations/supabase/client';

// Function to fetch notifications for a user
export const fetchUserNotifications = async (userId: string) => {
  try {
    console.log('[fetchUserNotifications] Fetching notifications for user:', userId);
    const { data, error } = await supabase
      .from('notifications')
      .select(`
        id,
        user_id,
        club_id,
        type,
        message,
        read,
        created_at,
        clubs:club_id (name, logo),
        users:user_id (name, avatar)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
      
    if (error) {
      console.error('[fetchUserNotifications] Error fetching notifications:', error);
      return [];
    }
    
    console.log('[fetchUserNotifications] Notifications fetched:', data?.length || 0, data);
    return data || [];
  } catch (error) {
    console.error('[fetchUserNotifications] Error in fetchUserNotifications:', error);
    return [];
  }
};
