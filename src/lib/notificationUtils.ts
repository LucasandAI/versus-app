import { Notification } from '@/types';
import { toast } from '@/hooks/use-toast';

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
export const refreshNotifications = () => {
  // This function can be expanded to fetch notifications from an API
  // For now, just trigger an event to reload from localStorage
  console.log('Refreshing notifications');
  const event = new CustomEvent('notificationsUpdated');
  window.dispatchEvent(event);
};

export const markAllNotificationsAsRead = () => {
  console.log("Marking all notifications as read");
  const storedNotifications = localStorage.getItem('notifications');
  if (!storedNotifications) return;
  
  try {
    const notifications: Notification[] = JSON.parse(storedNotifications);
    
    const updatedNotifications = notifications.map(notification => ({
      ...notification,
      read: true,
      previouslyDisplayed: true  // Mark as previously displayed
    }));
    
    console.log("Updated all notifications to read:", updatedNotifications);
    
    localStorage.setItem('notifications', JSON.stringify(updatedNotifications));
    
    const event = new CustomEvent('notificationsUpdated');
    window.dispatchEvent(event);
    
    return updatedNotifications;
  } catch (error) {
    console.error("Error marking all notifications as read:", error);
    return null;
  }
};

// Function to generate test notifications for development
export const generateTestNotifications = () => {
  const baseTimestamp = new Date().toISOString();
  
  const newNotifications = [
    // Club invite notifications
    {
      id: 'invite1',
      userId: 'user123',
      userName: 'Sarah Wilson',
      userAvatar: '/placeholder.svg',
      clubId: 'club1',
      clubName: 'Elite Runners',
      type: 'invitation',
      message: 'invited you to join',
      timestamp: baseTimestamp,
      read: false,
      previouslyDisplayed: false,
      distance: 0
    },
    {
      id: 'invite2',
      userId: 'user456',
      userName: 'Mike Thompson',
      userAvatar: '/placeholder.svg', 
      clubId: 'club2',
      clubName: 'Marathon Masters',
      type: 'invitation',
      message: 'invited you to join',
      timestamp: baseTimestamp,
      read: false,
      previouslyDisplayed: false,
      distance: 0
    },
    // Activity notifications
    {
      id: 'activity1',
      userId: 'user789',
      userName: 'Emma Davis',
      userAvatar: '/placeholder.svg',
      clubId: 'club3',
      clubName: 'Speed Demons',
      type: 'activity',
      timestamp: baseTimestamp,
      read: false,
      previouslyDisplayed: false,
      distance: 12.5
    },
    {
      id: 'activity2',
      userId: 'user101',
      userName: 'James Wilson',
      userAvatar: '/placeholder.svg',
      clubId: 'club4',
      clubName: 'Trail Blazers',
      type: 'activity',
      timestamp: baseTimestamp,
      read: false,
      previouslyDisplayed: false,
      distance: 8.3
    }
  ];

  // Get existing notifications
  const existingNotifications = localStorage.getItem('notifications');
  const currentNotifications = existingNotifications ? JSON.parse(existingNotifications) : [];
  
  // Add new notifications at the beginning of the array
  const updatedNotifications = [...newNotifications, ...currentNotifications];
  
  // Save to localStorage
  localStorage.setItem('notifications', JSON.stringify(updatedNotifications));
  
  // Dispatch event to update UI
  const event = new CustomEvent('notificationsUpdated');
  window.dispatchEvent(event);
  
  return updatedNotifications;
};

// Execute the function immediately to generate notifications
generateTestNotifications();
