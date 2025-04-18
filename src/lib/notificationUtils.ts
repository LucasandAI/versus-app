
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
    }
  ];

  // Store notifications in local storage
  localStorage.setItem('notifications', JSON.stringify(unreadNotifications));

  // Dispatch event to update notifications
  const event = new CustomEvent('notificationsUpdated');
  window.dispatchEvent(event);

  // Also update unread messages to show chat notification count
  const unreadMessagesMap = {
    'club-chat-1': 2
  };
  localStorage.setItem('unreadMessages', JSON.stringify(unreadMessagesMap));

  // Dispatch event to update unread messages
  const unreadEvent = new CustomEvent('unreadMessagesUpdated');
  window.dispatchEvent(unreadEvent);
};

// If this code is run in the browser, immediately simulate notifications
if (typeof window !== 'undefined') {
  simulateUnreadNotifications();
}
