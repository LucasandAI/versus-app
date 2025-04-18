
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
    
    // No longer reload notifications on window focus to avoid resetting read status
    // This prevents notifications from reappearing after navigation

    return () => {
      window.removeEventListener('notificationsUpdated', handleNotificationsUpdated);
    };
  }, [setNotifications]);
};
