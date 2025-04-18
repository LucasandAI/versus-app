
import React, { useEffect } from 'react';
import { useNotifications } from '@/hooks/useNotifications';
import { useChatNotifications } from '@/hooks/useChatNotifications';
import { simulateUnreadNotifications } from '@/lib/notificationUtils';

interface NotificationHandlerProps {
  setChatNotifications: (count: number) => void;
  setNotifications: (notifications: any[]) => void;
}

const NotificationHandler: React.FC<NotificationHandlerProps> = ({
  setChatNotifications,
  setNotifications,
}) => {
  // Initialize notifications on mount only if they don't exist
  useEffect(() => {
    const existingNotifications = localStorage.getItem('notifications');
    if (!existingNotifications) {
      // Only simulate if no notifications exist
      simulateUnreadNotifications();
    }
  }, []);

  useNotifications({ setNotifications });
  useChatNotifications({ setChatNotifications });

  return null;
};

export default NotificationHandler;
