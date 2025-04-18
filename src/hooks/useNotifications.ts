
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
    
    // Add event listeners for updates
    window.addEventListener('notificationsUpdated', handleNotificationsUpdated);
    
    // Also reload notifications on window focus to catch any new ones
    window.addEventListener('focus', loadNotificationsFromStorage);

    return () => {
      window.removeEventListener('notificationsUpdated', handleNotificationsUpdated);
      window.removeEventListener('focus', loadNotificationsFromStorage);
    };
  }, [setNotifications]);
};
