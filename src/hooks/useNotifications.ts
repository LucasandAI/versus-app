
import { useEffect, useState } from 'react';
import { Notification } from '@/types';
import { getNotificationsFromStorage, refreshNotifications } from '@/lib/notificationUtils';
import { supabase } from '@/integrations/supabase/client';
import { useApp } from '@/context/AppContext';

interface UseNotificationsProps {
  setNotifications: (notifications: Notification[]) => void;
}

export const useNotifications = ({ setNotifications }: UseNotificationsProps) => {
  const { currentUser, isSessionReady } = useApp();
  const [isSubscribed, setIsSubscribed] = useState(false);

  useEffect(() => {
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
    
    // Add event listeners for updates
    window.addEventListener('notificationsUpdated', handleNotificationsUpdated);
    
    // Initial load from storage
    loadNotificationsFromStorage();
    
    return () => {
      window.removeEventListener('notificationsUpdated', handleNotificationsUpdated);
    };
  }, [setNotifications]);

  // Set up real-time subscription for notifications
  useEffect(() => {
    if (!isSessionReady || !currentUser?.id || isSubscribed) return;

    console.log("[useNotifications] Setting up real-time subscription for notifications");
    
    // Fetch initial notifications to ensure we're up to date
    refreshNotifications().catch(error => {
      console.error("[useNotifications] Error refreshing notifications:", error);
    });
    
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
          
          // Refresh notifications from the database
          refreshNotifications().then(() => {
            // Dispatch event to update notifications in the UI
            window.dispatchEvent(new CustomEvent('notificationsUpdated'));
          }).catch(error => {
            console.error("[useNotifications] Error refreshing notifications after change:", error);
          });
        }
      )
      .subscribe((status) => {
        console.log('[useNotifications] Real-time subscription status:', status);
        if (status === 'SUBSCRIBED') {
          setIsSubscribed(true);
        }
      });
      
    return () => {
      console.log('[useNotifications] Cleaning up real-time subscription');
      supabase.removeChannel(channel);
      setIsSubscribed(false);
    };
  }, [currentUser?.id, isSessionReady, isSubscribed, setNotifications]);
};
