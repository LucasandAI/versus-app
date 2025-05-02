
import React, { useEffect } from 'react';
import { useNotifications } from '@/hooks/useNotifications';
import { useChatNotifications } from '@/hooks/useChatNotifications';
import { refreshNotifications } from '@/lib/notificationUtils';
import { useApp } from '@/context/AppContext';
import { useInitialAppLoad } from '@/hooks/useInitialAppLoad';

interface NotificationHandlerProps {
  setChatNotifications: (count: number) => void;
  setNotifications: (notifications: any[]) => void;
}

const NotificationHandler: React.FC<NotificationHandlerProps> = ({
  setChatNotifications,
  setNotifications,
}) => {
  const { isSessionReady } = useApp();
  const isAppReady = useInitialAppLoad();
  
  // Set up event listener to refresh notifications on focus
  useEffect(() => {
    if (!isSessionReady || !isAppReady) return;
    
    console.log("[NotificationHandler] Setting up window focus handler");
    
    const handleWindowFocus = () => {
      console.log("[NotificationHandler] Window focused, refreshing notifications");
      refreshNotifications().then(notifications => {
        if (notifications && notifications.length > 0) {
          setNotifications(notifications);
        }
      }).catch(error => {
        console.error("[NotificationHandler] Error refreshing notifications:", error);
      });
    };

    // Set up listener for join request events
    const handleJoinRequestUpdate = () => {
      console.log("[NotificationHandler] Join request updated, refreshing notifications");
      refreshNotifications().then(notifications => {
        if (notifications) {
          setNotifications(notifications);
        }
      }).catch(error => {
        console.error("[NotificationHandler] Error refreshing notifications:", error);
      });
    };
    
    window.addEventListener('focus', handleWindowFocus);
    window.addEventListener('clubRequestsUpdated', handleJoinRequestUpdate);
    window.addEventListener('joinRequestProcessed', handleJoinRequestUpdate);
    
    return () => {
      window.removeEventListener('focus', handleWindowFocus);
      window.removeEventListener('clubRequestsUpdated', handleJoinRequestUpdate);
      window.removeEventListener('joinRequestProcessed', handleJoinRequestUpdate);
    };
  }, [isSessionReady, isAppReady, setNotifications]);

  // Set up the hooks for notifications
  useNotifications({ setNotifications, isAppReady });
  useChatNotifications({ setChatNotifications });

  return null;
};

export default NotificationHandler;
