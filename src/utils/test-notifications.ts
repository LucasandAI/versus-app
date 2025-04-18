
import { Notification } from '@/types';

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

// Initialize test notifications
generateTestNotifications();
