
import { Notification, Club } from '@/types';
import { toast } from '@/hooks/use-toast';

// Function to find a club from localStorage by ID
export const findClubFromStorage = (clubId: string): Club | null => {
  try {
    const userDataStr = localStorage.getItem('userData');
    if (!userDataStr) return null;
    
    const userData = JSON.parse(userDataStr);
    if (!userData.clubs || !Array.isArray(userData.clubs)) return null;
    
    const club = userData.clubs.find((c: Club) => c.id === clubId);
    return club || null;
  } catch (error) {
    console.error('Error finding club from storage:', error);
    return null;
  }
};

// Function to create a mock club when real data is not available
export const getMockClub = (clubId: string, clubName: string): Club | null => {
  if (!clubId || !clubName) return null;
  
  return {
    id: clubId,
    name: clubName,
    logo: '/placeholder.svg',
    division: 'Bronze',
    members: [],
    matchHistory: []
  };
};

// Function to handle errors when a club cannot be found
export const handleClubError = (): void => {
  toast({
    title: "Club not found",
    description: "We couldn't find details for this club.",
    variant: "destructive",
  });
  console.error('Club not found or could not be loaded');
};

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

// Key fix: Improved hasPendingInvite function with better logging and type validation
export const hasPendingInvite = (clubId: string): boolean => {
  if (!clubId) {
    console.error('No clubId provided to hasPendingInvite');
    return false;
  }
  
  console.log('Checking pending invite for club ID:', clubId);
  const storedNotifications = localStorage.getItem('notifications');
  if (!storedNotifications) {
    console.log('No notifications found in storage');
    return false;
  }
  
  try {
    const notifications: Notification[] = JSON.parse(storedNotifications);
    console.log('All notifications:', notifications);
    
    // Enhanced filtering to explicitly check for invitation type and matching clubId
    const pendingInvites = notifications.filter(notification => {
      const isInvitation = notification.type === 'invitation';
      const isForThisClub = notification.clubId === clubId;
      const isUnread = !notification.read;
      
      console.log(`Checking notification: type=${notification.type}, clubId=${notification.clubId}, isUnread=${isUnread}`);
      return isInvitation && isForThisClub && isUnread;
    });
    
    console.log('Pending invites for club:', pendingInvites);
    return pendingInvites.length > 0;
  } catch (error) {
    console.error('Error checking pending invites:', error);
    return false;
  }
};
