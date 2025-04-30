
import { useEffect } from 'react';
import { Notification } from '@/types';
import { getNotificationsFromStorage, refreshNotifications } from '@/lib/notificationUtils';

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

    // Initially fetch fresh notifications from Supabase
    const fetchInitialNotifications = async () => {
      console.log("[useNotifications] Fetching initial notifications");
      await refreshNotifications();
      loadNotificationsFromStorage();
    };

    // Load notifications immediately
    fetchInitialNotifications();

    // Listen for notification updates
    const handleNotificationsUpdated = () => {
      console.log("[useNotifications] Notification update event received");
      loadNotificationsFromStorage();
    };
    
    // Add event listeners for updates
    window.addEventListener('notificationsUpdated', handleNotificationsUpdated);
    
    // Also reload notifications on window focus to catch any new ones
    window.addEventListener('focus', fetchInitialNotifications);

    return () => {
      window.removeEventListener('notificationsUpdated', handleNotificationsUpdated);
      window.removeEventListener('focus', fetchInitialNotifications);
    };
  }, [setNotifications]);
};
