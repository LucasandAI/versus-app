
import { useEffect } from 'react';
import { Notification } from '@/types';
import { getNotificationsFromStorage } from '@/lib/notificationUtils';
import { useApp } from '@/context/AppContext';
import { supabase } from '@/integrations/supabase/client';

interface UseNotificationsProps {
  setNotifications: (notifications: Notification[]) => void;
  isAppReady?: boolean;
}

export const useNotifications = ({ setNotifications, isAppReady = true }: UseNotificationsProps) => {
  const { currentUser } = useApp();
  
  useEffect(() => {
    // Skip initialization if app is not ready
    if (!isAppReady || !currentUser?.id) {
      console.log("[useNotifications] App not ready or user not logged in, skipping setup");
      return;
    }
    
    // Function to load notifications from localStorage
    const loadNotificationsFromStorage = () => {
      console.log("[useNotifications] Loading notifications from storage");
      const notifications = getNotificationsFromStorage();
      console.log("[useNotifications] Loaded notifications:", notifications.length, notifications);
      if (notifications.length > 0) {
        setNotifications(notifications);
      } else {
        console.log("[useNotifications] No notifications found in storage or empty array");
      }
    };

    // Listen for notification updates
    const handleNotificationsUpdated = () => {
      console.log("[useNotifications] Notification update event received");
      loadNotificationsFromStorage();
    };
    
    // Set up real-time subscription for notifications
    console.log("[useNotifications] Setting up real-time subscription for user:", currentUser.id);
    const channel = supabase
      .channel('notifications-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${currentUser.id}`
        },
        (payload) => {
          console.log('[useNotifications] Notification change detected:', payload);
          
          // Trigger notification update
          window.dispatchEvent(new CustomEvent('notificationsUpdated'));
        }
      )
      .subscribe((status) => {
        console.log('[useNotifications] Real-time subscription status:', status);
      });
    
    // Add event listeners for updates
    window.addEventListener('notificationsUpdated', handleNotificationsUpdated);
    window.addEventListener('joinRequestProcessed', handleNotificationsUpdated);
    window.addEventListener('clubRequestsUpdated', handleNotificationsUpdated);
    
    // Initial load from storage
    loadNotificationsFromStorage();
    
    return () => {
      window.removeEventListener('notificationsUpdated', handleNotificationsUpdated);
      window.removeEventListener('joinRequestProcessed', handleNotificationsUpdated);
      window.removeEventListener('clubRequestsUpdated', handleNotificationsUpdated);
      supabase.removeChannel(channel);
    };
  }, [setNotifications, currentUser?.id, isAppReady]);
};
