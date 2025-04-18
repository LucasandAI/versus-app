
import { useEffect } from 'react';
import { Notification } from '@/types';
import { getNotificationsFromStorage } from '@/lib/notificationUtils';

interface UseNotificationsProps {
  setNotifications: (notifications: Notification[]) => void;
}

export const useNotifications = ({ setNotifications }: UseNotificationsProps) => {
  useEffect(() => {
    const loadNotificationsFromStorage = () => {
      console.log("Loading notifications from storage");
      const notifications = getNotificationsFromStorage();
      console.log("Loaded notifications:", notifications);
      setNotifications(notifications);
    };

    // Load notifications immediately
    loadNotificationsFromStorage();

    // Listen for notification updates
    const handleNotificationsUpdated = () => {
      console.log("Notification update event received");
      loadNotificationsFromStorage();
    };
    
    window.addEventListener('notificationsUpdated', handleNotificationsUpdated);
    window.addEventListener('focus', handleNotificationsUpdated); // Reload on window focus

    return () => {
      window.removeEventListener('notificationsUpdated', handleNotificationsUpdated);
      window.removeEventListener('focus', handleNotificationsUpdated);
    };
  }, [setNotifications]);
};
