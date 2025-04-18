
import { useEffect } from 'react';
import { Notification } from '@/types';
import { simulateUnreadNotifications } from '@/lib/notificationUtils';

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
          simulateUnreadNotifications();
        }
      } else {
        // If no notifications in storage, simulate them
        simulateUnreadNotifications();
      }
    };

    // Load notifications immediately
    loadNotificationsFromStorage();

    // Listen for notification updates
    window.addEventListener('notificationsUpdated', loadNotificationsFromStorage);

    return () => {
      window.removeEventListener('notificationsUpdated', loadNotificationsFromStorage);
    };
  }, [setNotifications]);
};
