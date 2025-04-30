
import React, { useEffect } from 'react';
import { useNotifications } from '@/hooks/useNotifications';
import { useChatNotifications } from '@/hooks/useChatNotifications';
import { refreshNotifications } from '@/lib/notificationUtils';

interface NotificationHandlerProps {
  setChatNotifications: (count: number) => void;
  setNotifications: (notifications: any[]) => void;
}

const NotificationHandler: React.FC<NotificationHandlerProps> = ({
  setChatNotifications,
  setNotifications,
}) => {
  // Initialize notifications on mount - this will be our SINGLE source of truth
  useEffect(() => {
    console.log("[NotificationHandler] Initializing notifications");
    
    // Force refresh notifications on component mount to ensure we have the latest
    const initializeNotifications = async () => {
      console.log("[NotificationHandler] Fetching initial notifications");
      
      try {
        const refreshedNotifications = await refreshNotifications();
        console.log("[NotificationHandler] Notifications fetched:", refreshedNotifications.length, refreshedNotifications);
        
        if (refreshedNotifications && refreshedNotifications.length > 0) {
          console.log("[NotificationHandler] Setting initial notifications:", refreshedNotifications.length);
          setNotifications(refreshedNotifications);
        } else {
          console.log("[NotificationHandler] No notifications to set or empty array returned");
        }
      } catch (error) {
        console.error("[NotificationHandler] Error fetching notifications:", error);
      }
    };
    
    initializeNotifications();
    
    // Also set up an event listener to refresh notifications on focus
    const handleWindowFocus = () => {
      console.log("[NotificationHandler] Window focused, refreshing notifications");
      initializeNotifications();
    };
    
    window.addEventListener('focus', handleWindowFocus);
    
    return () => {
      window.removeEventListener('focus', handleWindowFocus);
    };
  }, [setNotifications]);

  // Set up the hooks for notifications
  useNotifications({ setNotifications });
  useChatNotifications({ setChatNotifications });

  return null;
};

export default NotificationHandler;
