
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
