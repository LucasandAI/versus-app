
import { useEffect } from 'react';
import { Notification } from '@/types';
import { getNotificationsFromStorage, refreshNotifications } from '@/lib/notificationUtils';
import { supabase } from '@/integrations/supabase/client';

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

    // Initially fetch fresh notifications from Supabase
    const fetchInitialNotifications = async () => {
      await refreshNotifications();
      loadNotificationsFromStorage();
    };

    // Load notifications immediately
    fetchInitialNotifications();

    // Listen for notification updates
    const handleNotificationsUpdated = () => {
      console.log("Notification update event received");
      loadNotificationsFromStorage();
    };
    
    // Set up real-time subscription for notifications
    const setupRealtimeSubscription = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      console.log("Setting up realtime notifications subscription for user:", user.id);
      
      // Subscribe to new notifications
      const channel = supabase
        .channel('notifications-changes')
        .on(
          'postgres_changes',
          { 
            event: 'INSERT', 
            schema: 'public', 
            table: 'notifications',
            filter: `user_id=eq.${user.id}`
          },
          async (payload) => {
            console.log('New notification received:', payload);
            // Refresh all notifications to ensure consistency
            await refreshNotifications();
            loadNotificationsFromStorage();
          }
        )
        .on(
          'postgres_changes',
          { 
            event: 'UPDATE', 
            schema: 'public', 
            table: 'notifications',
            filter: `user_id=eq.${user.id}`
          },
          async (payload) => {
            console.log('Notification updated:', payload);
            await refreshNotifications();
            loadNotificationsFromStorage();
          }
        )
        .subscribe();
        
      console.log("Realtime subscription set up successfully");
      return channel;
    };
    
    const channelPromise = setupRealtimeSubscription();
    
    // Add event listeners for updates
    window.addEventListener('notificationsUpdated', handleNotificationsUpdated);
    
    // Also reload notifications on window focus to catch any new ones
    window.addEventListener('focus', fetchInitialNotifications);

    return () => {
      window.removeEventListener('notificationsUpdated', handleNotificationsUpdated);
      window.removeEventListener('focus', fetchInitialNotifications);
      
      // Clean up the channel subscription
      if (channelPromise) {
        channelPromise.then(ch => {
          if (ch) supabase.removeChannel(ch);
        });
      }
    };
  }, [setNotifications]);
};
