
import { useEffect } from 'react';
import { Notification } from '@/types';
import { simulateUnreadNotifications } from '@/lib/notificationUtils';

interface UseNotificationsProps {
  setNotifications: (notifications: Notification[]) => void;
}

export const useNotifications = ({ setNotifications }: UseNotificationsProps) => {
  useEffect(() => {
    const loadNotificationsFromStorage = () => {
      console.log("Loading notifications from storage");
      const storedNotifications = localStorage.getItem('notifications');
      if (storedNotifications) {
        try {
          const parsedNotifications = JSON.parse(storedNotifications);
          console.log("Loaded notifications:", parsedNotifications);
          setNotifications(parsedNotifications);
        } catch (error) {
          console.error("Error parsing notifications:", error);
          // If we can't parse, reset the notifications
          simulateUnreadNotifications();
        }
      } else {
        // If no notifications in storage, simulate them
        console.log("No notifications in storage, simulating");
        simulateUnreadNotifications();
      }
    };

    // Load notifications immediately
    loadNotificationsFromStorage();

    // Listen for notification updates
    const handleNotificationsUpdated = () => {
      console.log("Notification update event received");
      loadNotificationsFromStorage();
    };
    
    window.addEventListener('notificationsUpdated', handleNotificationsUpdated);

    return () => {
      window.removeEventListener('notificationsUpdated', handleNotificationsUpdated);
    };
  }, [setNotifications]);
};
