
import { Notification, Club } from '@/types';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

// Function to handle individual notification actions (read, delete)
export const handleNotification = (id: string, action: 'read' | 'delete') => {
  const storedNotifications = localStorage.getItem('notifications');
  if (!storedNotifications) return null;
  
  try {
    const notifications: Notification[] = JSON.parse(storedNotifications);
    let updatedNotifications: Notification[];
    
    if (action === 'read') {
      updatedNotifications = notifications.map(notification => 
        notification.id === id ? { ...notification, read: true, previouslyDisplayed: true } : notification
      );
      console.log(`Marked notification ${id} as read`);
    } else if (action === 'delete') {
      updatedNotifications = notifications.filter(notification => notification.id !== id);
      console.log(`Deleted notification ${id}`);
    } else {
      return notifications;
    }
    
    localStorage.setItem('notifications', JSON.stringify(updatedNotifications));
    
    const event = new CustomEvent('notificationsUpdated');
    window.dispatchEvent(event);
    
    return updatedNotifications;
  } catch (error) {
    console.error(`Error handling notification ${id}:`, error);
    return null;
  }
};

// Function to get notifications from storage
export const getNotificationsFromStorage = (): Notification[] => {
  try {
    const notifications = localStorage.getItem('notifications');
    console.log('[getNotificationsFromStorage] Notifications from storage:', notifications ? JSON.parse(notifications).length : 0);
    return notifications ? JSON.parse(notifications) : [];
  } catch (error) {
    console.error('[getNotificationsFromStorage] Error getting notifications from storage:', error);
    return [];
  }
};

// Function to refresh notifications (used when initializing the app)
export const refreshNotifications = async () => {
  // Get current user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    console.log('[refreshNotifications] No user found, skipping fetch');
    return;
  }
  
  console.log('[refreshNotifications] Fetching notifications for user:', user.id);
  
  // Fetch notifications from Supabase
  const { data, error } = await supabase
    .from('notifications')
    .select(`
      id,
      user_id,
      club_id,
      type,
      title,
      description,
      message,
      read,
      created_at,
      data,
      clubs:club_id (name, logo),
      users:user_id (name, avatar)
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });
    
  if (error) {
    console.error('[refreshNotifications] Error fetching notifications:', error);
    return;
  }
  
  console.log('[refreshNotifications] Notifications fetched:', data.length, data);
  
  // Process notifications
  const processedNotifications = data.map(notification => ({
    id: notification.id,
    type: notification.type,
    title: notification.title || (notification.type === 'join_request' ? 'Request Accepted' : 'Notification'),
    description: notification.description || '',
    userId: notification.user_id,
    userName: notification?.users?.name || 'Unknown User',
    userAvatar: notification?.users?.avatar || null,
    clubId: notification.club_id,
    clubName: notification.clubs?.name || 'Unknown Club',
    message: notification.message || '',
    timestamp: notification.created_at,
    read: notification.read || false,
    data: notification.data || {},
    previouslyDisplayed: false
  }));
  
  console.log('[refreshNotifications] Processed notifications:', processedNotifications.length);
  
  // Update local storage
  localStorage.setItem('notifications', JSON.stringify(processedNotifications));
  
  // Dispatch event to update UI
  const event = new CustomEvent('notificationsUpdated');
  window.dispatchEvent(event);
  
  return processedNotifications;
};

export const markAllNotificationsAsRead = async () => {
  console.log("Marking all notifications as read");
  
  // Get current user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  
  // Update all pending notifications to read in Supabase
  const { error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('user_id', user.id)
    .eq('read', false);
    
  if (error) {
    console.error('Error marking notifications as read:', error);
    return;
  }
  
  // Update local storage
  const storedNotifications = localStorage.getItem('notifications');
  if (storedNotifications) {
    try {
      const notifications: Notification[] = JSON.parse(storedNotifications);
      
      const updatedNotifications = notifications.map(notification => ({
        ...notification,
        read: true,
        previouslyDisplayed: true  // Mark as previously displayed
      }));
      
      localStorage.setItem('notifications', JSON.stringify(updatedNotifications));
      
      const event = new CustomEvent('notificationsUpdated');
      window.dispatchEvent(event);
      
      return updatedNotifications;
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
    }
  }
  
  return null;
};

// Function to check for pending club invites
export const hasPendingInvite = async (clubId: string): Promise<boolean> => {
  // Get current user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;
  
  // Check for pending invite
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', user.id)
    .eq('club_id', clubId)
    .in('type', ['invite', 'join_request'])
    .eq('read', false)
    .single();
    
  if (error) {
    if (error.code === 'PGRST116') { // No rows
      return false;
    }
    console.error('Error checking pending invites:', error);
    return false;
  }
  
  return !!data;
};

// Utility functions for notification components
export const findClubFromStorage = (clubId?: string): Club | null => {
  if (!clubId) return null;
  
  // Try to find in local storage
  const storedClubs = localStorage.getItem('userClubs');
  if (storedClubs) {
    try {
      const clubs: Club[] = JSON.parse(storedClubs);
      return clubs.find(club => club.id === clubId) || null;
    } catch (error) {
      console.error('Error parsing clubs from storage:', error);
    }
  }
  
  return null;
};

export const getMockClub = (clubId?: string, clubName?: string): Club | null => {
  if (!clubId || !clubName) return null;
  
  // Create a basic mock club for UI purposes
  return {
    id: clubId,
    name: clubName,
    logo: '/placeholder.svg',
    division: 'bronze',
    tier: 5,
    elitePoints: 0,
    members: [],
    matchHistory: []
  };
};

export const handleClubError = () => {
  toast({
    title: "Error",
    description: "Could not load club details",
    variant: "destructive"
  });
};
