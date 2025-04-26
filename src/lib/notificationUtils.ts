
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
    return notifications ? JSON.parse(notifications) : [];
  } catch (error) {
    console.error('Error getting notifications from storage:', error);
    return [];
  }
};

// Function to refresh notifications (used when initializing the app)
export const refreshNotifications = async () => {
  // Get current user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  
  // Fetch notifications from Supabase
  const { data, error } = await supabase
    .from('notifications')
    .select(`
      *,
      clubs:club_id (name, logo),
      users:user_id (name, avatar)
    `)
    .eq('user_id', user.id)
    .or('status.eq.pending,status.eq.read')
    .order('created_at', { ascending: false });
    
  if (error) {
    console.error('Error fetching notifications:', error);
    return;
  }
  
  // Process notifications
  const processedNotifications = data.map(notification => ({
    id: notification.id,
    type: notification.type === 'invite' ? 'invitation' : notification.type,
    userId: notification.type === 'invite' ? notification.user_id : user.id,
    userName: notification.type === 'invite' ? notification?.users?.name || 'Unknown User' : user?.user_metadata?.name || 'Unknown User',
    userAvatar: notification.type === 'invite' ? notification?.users?.avatar : null,
    clubId: notification.club_id,
    clubName: notification.clubs?.name || 'Unknown Club',
    message: notification.message || '',
    timestamp: notification.created_at,
    read: notification.status === 'read',
    previouslyDisplayed: false
  }));
  
  // Update local storage
  localStorage.setItem('notifications', JSON.stringify(processedNotifications));
  
  // Dispatch event to update UI
  const event = new CustomEvent('notificationsUpdated');
  window.dispatchEvent(event);
};

export const markAllNotificationsAsRead = async () => {
  console.log("Marking all notifications as read");
  
  // Get current user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  
  // Update all pending notifications to read in Supabase
  const { error } = await supabase
    .from('notifications')
    .update({ status: 'read' })
    .eq('user_id', user.id)
    .eq('status', 'pending');
    
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
    .eq('status', 'pending')
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
