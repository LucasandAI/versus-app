
import { useEffect } from 'react';
import { Notification } from '@/types';

interface UseNotificationsProps {
  setNotifications: (notifications: Notification[]) => void;
}

export const useNotifications = ({ setNotifications }: UseNotificationsProps) => {
  useEffect(() => {
    const loadNotificationsFromStorage = () => {
      const storedNotifications = localStorage.getItem('notifications');
      if (storedNotifications) {
        try {
          const parsedNotifications = JSON.parse(storedNotifications);
          setNotifications(parsedNotifications);
        } catch (error) {
          console.error("Error parsing notifications:", error);
          initializeDefaultNotifications();
        }
      } else {
        initializeDefaultNotifications();
      }
    };

    const initializeDefaultNotifications = () => {
      const defaultNotifications = [
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
      setNotifications(defaultNotifications);
      localStorage.setItem('notifications', JSON.stringify(defaultNotifications));
    };

    loadNotificationsFromStorage();

    window.addEventListener('notificationsUpdated', loadNotificationsFromStorage);

    return () => {
      window.removeEventListener('notificationsUpdated', loadNotificationsFromStorage);
    };
  }, [setNotifications]);
};
