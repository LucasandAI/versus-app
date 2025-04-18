
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
