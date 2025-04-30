
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
  // Initialize notifications on mount
  useEffect(() => {
    console.log("[NotificationHandler] Initializing notifications");
    
    // Force refresh notifications on component mount to ensure we have the latest
    const initializeNotifications = async () => {
      console.log("[NotificationHandler] Fetching initial notifications");
      const refreshedNotifications = await refreshNotifications();
      if (refreshedNotifications && refreshedNotifications.length > 0) {
        console.log("[NotificationHandler] Setting initial notifications:", refreshedNotifications.length);
        setNotifications(refreshedNotifications);
      }
    };
    
    initializeNotifications();
  }, [setNotifications]);

  // Set up the hooks for notifications
  useNotifications({ setNotifications });
  useChatNotifications({ setChatNotifications });

  return null;
};

export default NotificationHandler;
