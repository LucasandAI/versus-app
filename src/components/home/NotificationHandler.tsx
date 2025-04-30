
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
    console.log("NotificationHandler: Initializing notifications");
    // Force refresh notifications on component mount to ensure we have the latest
    const initializeNotifications = async () => {
      const refreshedNotifications = await refreshNotifications();
      if (refreshedNotifications) {
        console.log("NotificationHandler: Setting initial notifications:", refreshedNotifications.length);
        setNotifications(refreshedNotifications);
      } else {
        // Get updated notifications from localStorage after refresh
        const storedNotifications = localStorage.getItem('notifications');
        if (storedNotifications) {
          try {
            const parsedNotifications = JSON.parse(storedNotifications);
            console.log("NotificationHandler: Loaded notifications from storage:", parsedNotifications.length);
            setNotifications(parsedNotifications);
          } catch (error) {
            console.error("NotificationHandler: Error parsing notifications:", error);
          }
        }
      }
    };
    
    initializeNotifications();
  }, [setNotifications]);

  useNotifications({ setNotifications });
  useChatNotifications({ setChatNotifications });

  return null;
};

export default NotificationHandler;
