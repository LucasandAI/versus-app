
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
      read: false,
      type: 'activity'
    },
    {
      id: 'club-invite-1',
      userId: '7',
      userName: 'Alice Sprint',
      userAvatar: '/placeholder.svg',
      clubId: 'ac2',
      clubName: 'Hill Climbers',
      distance: 0,
      timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
      read: false,
      type: 'invitation',
      message: 'invited you to join'
    },
    // New notification 1: Another activity notification
    {
      id: 'team-activity-2',
      userId: '3',
      userName: 'Mike Runner',
      userAvatar: '/placeholder.svg', 
      clubId: '2', 
      clubName: 'City Striders',
      distance: 7.5,
      timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
      read: false,
      type: 'activity'
    },
    // New notification 2: Another invitation notification
    {
      id: 'club-invite-2',
      userId: '5',
      userName: 'Sarah Pacer',
      userAvatar: '/placeholder.svg',
      clubId: 'ac3',
      clubName: 'Urban Pacers', // Fixed to match available club
      distance: 0,
      timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
      read: false,
      type: 'invitation',
      message: 'invited you to join'
    }
  ];

  // Store notifications in local storage
  localStorage.setItem('notifications', JSON.stringify(unreadNotifications));

  // Dispatch event to update notifications
  const event = new CustomEvent('notificationsUpdated');
  window.dispatchEvent(event);

  // We're not setting unread messages by default anymore
  // Just make sure unreadMessages exists in localStorage but with no unread messages
  const unreadMessagesMap = {};
  localStorage.setItem('unreadMessages', JSON.stringify(unreadMessagesMap));

  // Dispatch event to update unread messages
  const unreadEvent = new CustomEvent('unreadMessagesUpdated');
  window.dispatchEvent(unreadEvent);
};

// If this code is run in the browser, immediately simulate notifications
if (typeof window !== 'undefined') {
  // Only simulate if needed - don't override existing notifications
  const existingNotifications = localStorage.getItem('notifications');
  if (!existingNotifications) {
    simulateUnreadNotifications();
  }
}
