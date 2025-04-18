
import React, { useEffect } from 'react';
import { useNotifications } from '@/hooks/useNotifications';
import { useChatNotifications } from '@/hooks/useChatNotifications';
import { simulateUnreadNotifications, refreshNotifications } from '@/lib/notificationUtils';

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
    refreshNotifications();
    
    // Get updated notifications from localStorage after refresh
    const storedNotifications = localStorage.getItem('notifications');
    if (storedNotifications) {
      try {
        const parsedNotifications = JSON.parse(storedNotifications);
        console.log("Loaded notifications:", parsedNotifications);
        setNotifications(parsedNotifications);
      } catch (error) {
        console.error("Error parsing notifications:", error);
      }
    }
  }, [setNotifications]);

  useNotifications({ setNotifications });
  useChatNotifications({ setChatNotifications });

  return null;
};

export default NotificationHandler;
