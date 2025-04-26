
import { supabase } from '@/integrations/supabase/client';
import { JoinRequest } from '@/types';

// Function to fetch notifications for a user
export const fetchUserNotifications = async (userId: string) => {
  try {
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
  } catch (error) {
    console.error('Error in fetchUserNotifications:', error);
    return [];
  }
};

// Function to check if a user has a pending invite for a specific club
export const hasPendingInvite = async (clubId: string, userId?: string): Promise<boolean> => {
  try {
    if (!userId) {
      // Get the current user's ID
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;
      userId = user.id;
    }

    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('club_id', clubId)
      .eq('user_id', userId)
      .in('type', ['invite']) // Use 'invite' instead of 'club_invite'
      .eq('status', 'pending')
      .single();

    if (error) {
      if (error.code === 'PGRST116') { // No rows returned
        return false;
      }
      console.error('Error checking pending invites:', error);
      return false;
    }

    return !!data;
  } catch (error) {
    console.error('Error in hasPendingInvite:', error);
    return false;
  }
};

// Function to check if a user has pending join requests for a club
export const hasPendingJoinRequest = async (userId: string, clubId: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from('club_requests')
      .select('*')
      .eq('user_id', userId)
      .eq('club_id', clubId)
      .eq('status', 'pending')
      .single();

    if (error) {
      if (error.code === 'PGRST116') { // No rows returned
        return false;
      }
      console.error('Error checking pending join requests:', error);
      return false;
    }

    return !!data;
  } catch (error) {
    console.error('Error in hasPendingJoinRequest:', error);
    return false;
  }
};

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

// Function to fetch join requests for a club
export const fetchClubJoinRequests = async (clubId: string): Promise<JoinRequest[]> => {
  try {
    const { data, error } = await supabase
      .from('club_requests')
      .select(`
        id,
        user_id,
        club_id,
        status,
        created_at,
        users:user_id (
          id,
          name,
          avatar
        )
      `)
      .eq('club_id', clubId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });
      
    if (error) {
      console.error('Error fetching join requests:', error);
      return [];
    }
    
    return data?.map(item => ({
      id: item.id,
      userId: item.user_id,
      userName: item.users?.name || 'Unknown',
      userAvatar: item.users?.avatar || '',
      clubId: item.club_id,
      createdAt: item.created_at
    })) || [];
  } catch (error) {
    console.error('Error in fetchClubJoinRequests:', error);
    return [];
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

// Function to check if a club is full
export const isClubFull = async (clubId: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from('club_members')
      .select('user_id', { count: 'exact' })
      .eq('club_id', clubId);

    if (error) {
      console.error('Error checking club capacity:', error);
      return false;
    }

    return (data?.length || 0) >= 5;
  } catch (error) {
    console.error('Error in isClubFull:', error);
    return false;
  }
};
