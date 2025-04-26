
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

// Function to check if a user has a pending invite for a specific club
export const hasPendingInvite = async (clubId: string, userId?: string): Promise<boolean> => {
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
    .in('type', ['invite', 'join_request'])
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
};

// Function to check if a user has pending join requests for a club
export const hasPendingJoinRequest = async (userId: string, clubId: string): Promise<boolean> => {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .eq('club_id', clubId)
    .eq('type', 'join_request')
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
};

// Function to create a new notification
export const createNotification = async (notification: {
  user_id: string;
  type: 'invite' | 'join_request' | 'match_result' | 'match_start' | 'achievement';
  club_id: string;
  message?: string;
}) => {
  const { error } = await supabase
    .from('notifications')
    .insert([
      {
        ...notification,
        status: 'pending',
        created_at: new Date().toISOString()
      }
    ]);
    
  if (error) {
    console.error('Error creating notification:', error);
    return false;
  }
  
  return true;
};

// Function to update notification status
export const updateNotificationStatus = async (
  notificationId: string,
  status: 'accepted' | 'rejected' | 'read'
) => {
  const { error } = await supabase
    .from('notifications')
    .update({ status })
    .eq('id', notificationId);

  if (error) {
    console.error('Error updating notification:', error);
    return false;
  }

  return true;
};

// Function to fetch join requests for a club
export const fetchClubJoinRequests = async (clubId: string) => {
  const { data, error } = await supabase
    .from('notifications')
    .select(`
      id,
      user_id,
      message,
      created_at,
      users:user_id (
        id,
        name,
        avatar
      )
    `)
    .eq('club_id', clubId)
    .eq('type', 'join_request')
    .eq('status', 'pending')
    .order('created_at', { ascending: false });
    
  if (error) {
    console.error('Error fetching join requests:', error);
    return [];
  }
  
  return data?.map(item => ({
    id: item.id,
    userId: item.user_id,
    userName: item.users.name,
    userAvatar: item.users.avatar,
    clubId: clubId,
    createdAt: item.created_at
  })) || [];
};
