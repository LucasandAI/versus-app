
import { useEffect } from 'react';
import { Notification } from '@/types';
import { getNotificationsFromStorage } from '@/lib/notificationUtils';

interface UseNotificationsProps {
  setNotifications: (notifications: Notification[]) => void;
}

export const useNotifications = ({ setNotifications }: UseNotificationsProps) => {
  useEffect(() => {
    // Function to load notifications from localStorage
    const loadNotificationsFromStorage = () => {
      console.log("[useNotifications] Loading notifications from storage");
      const notifications = getNotificationsFromStorage();
      console.log("[useNotifications] Loaded notifications:", notifications.length, notifications);
      setNotifications(notifications);
    };

    // Listen for notification updates
    const handleNotificationsUpdated = () => {
      console.log("[useNotifications] Notification update event received");
      loadNotificationsFromStorage();
    };
    
    // Add event listeners for updates
    window.addEventListener('notificationsUpdated', handleNotificationsUpdated);
    
    return () => {
      window.removeEventListener('notificationsUpdated', handleNotificationsUpdated);
    };
  }, [setNotifications]);
};
