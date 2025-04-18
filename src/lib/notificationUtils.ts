import { Notification } from '@/types';

export const simulateUnreadNotifications = () => {
  const unreadNotifications: Notification[] = [
    {
      id: 'club-invite-1',
      userId: '7',
      userName: 'Alice Sprint',
      userAvatar: '/placeholder.svg',
      clubId: 'ac2',
      clubName: 'Hill Climbers',
      distance: 0,
      timestamp: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
      read: false,
      type: 'invitation',
      message: 'invited you to join'
    },
    {
      id: 'club-invite-2',
      userId: '8',
      userName: 'Bob Marathon',
      userAvatar: '/placeholder.svg',
      clubId: 'ac3',
      clubName: 'Urban Pacers',
      distance: 0,
      timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
      read: false,
      type: 'invitation',
      message: 'invited you to join'
    }
  ];

  console.log("Simulating notifications:", unreadNotifications);
  
  // Save to localStorage
  localStorage.setItem('notifications', JSON.stringify(unreadNotifications));

  // Trigger notification update event
  const event = new CustomEvent('notificationsUpdated');
  window.dispatchEvent(event);

  // Also update unread messages map
  const unreadMessagesMap = {};
  localStorage.setItem('unreadMessages', JSON.stringify(unreadMessagesMap));

  const unreadEvent = new CustomEvent('unreadMessagesUpdated');
  window.dispatchEvent(unreadEvent);
};

// Force refresh notifications by removing existing ones first
export const refreshNotifications = () => {
  console.log("Refreshing notifications");
  localStorage.removeItem('notifications');
  simulateUnreadNotifications();
};

// Handle a notification (mark as read, join, decline, etc.)
export const handleNotification = (notificationId: string, action: 'read' | 'delete') => {
  console.log(`Handling notification ${notificationId} with action: ${action}`);
  const storedNotifications = localStorage.getItem('notifications');
  
  if (!storedNotifications) return;
  
  try {
    const notifications: Notification[] = JSON.parse(storedNotifications);
    let updatedNotifications: Notification[];
    
    if (action === 'read') {
      // Mark as read but keep in the list
      updatedNotifications = notifications.map(notification => 
        notification.id === notificationId 
          ? { ...notification, read: true } 
          : notification
      );
    } else {
      // Remove from the list entirely
      updatedNotifications = notifications.filter(
        notification => notification.id !== notificationId
      );
    }
    
    // Save back to localStorage
    localStorage.setItem('notifications', JSON.stringify(updatedNotifications));
    
    // Dispatch event to update UI
    const event = new CustomEvent('notificationsUpdated');
    window.dispatchEvent(event);
    
    return updatedNotifications;
  } catch (error) {
    console.error("Error handling notification:", error);
    return null;
  }
};

// Get all notifications from storage
export const getNotificationsFromStorage = (): Notification[] => {
  const storedNotifications = localStorage.getItem('notifications');
  if (storedNotifications) {
    try {
      return JSON.parse(storedNotifications);
    } catch (error) {
      console.error("Error parsing notifications:", error);
      return [];
    }
  }
  return [];
};

// Initialize notifications on first load if they don't exist yet
if (typeof window !== 'undefined') {
  const existingNotifications = localStorage.getItem('notifications');
  if (!existingNotifications) {
    simulateUnreadNotifications();
  }
}
