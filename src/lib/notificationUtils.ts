
import { Notification } from '@/types';

export const simulateUnreadNotifications = () => {
  const unreadNotifications: Notification[] = [
    {
      id: 'team-activity-1',
      userId: '2',
      userName: 'Jane Sprinter',
      userAvatar: '/placeholder.svg',
      clubId: '1',
      clubName: 'Weekend Warriors',
      distance: 5.2,
      timestamp: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
      read: true,
      type: 'activity'
    },
    {
      id: 'team-activity-2',
      userId: '3',
      userName: 'Mike Runner',
      userAvatar: '/placeholder.svg', 
      clubId: '2', 
      clubName: 'City Striders',
      distance: 7.5,
      timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
      read: true,
      type: 'activity'
    },
    // Add 4 new club invite notifications
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
      clubName: 'Trail Blazers',
      distance: 0,
      timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
      read: false,
      type: 'invitation',
      message: 'invited you to join'
    },
    {
      id: 'club-invite-3',
      userId: '9',
      userName: 'Charlie Race',
      userAvatar: '/placeholder.svg',
      clubId: 'ac4',
      clubName: 'Mountain Goats',
      distance: 0,
      timestamp: new Date(Date.now() - 8 * 60 * 1000).toISOString(),
      read: false,
      type: 'invitation',
      message: 'invited you to join'
    },
    {
      id: 'club-invite-4',
      userId: '10',
      userName: 'Diana Track',
      userAvatar: '/placeholder.svg',
      clubId: 'ac5',
      clubName: 'Speed Demons',
      distance: 0,
      timestamp: new Date(Date.now() - 12 * 60 * 1000).toISOString(),
      read: false,
      type: 'invitation',
      message: 'invited you to join'
    }
  ];

  // Make sure to save to localStorage
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
  localStorage.removeItem('notifications');
  simulateUnreadNotifications();
};

// Initialize notifications on first load if they don't exist yet
if (typeof window !== 'undefined') {
  const existingNotifications = localStorage.getItem('notifications');
  if (!existingNotifications) {
    simulateUnreadNotifications();
  }
}
