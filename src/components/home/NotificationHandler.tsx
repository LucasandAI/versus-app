
import React, { useEffect } from 'react';
import { SupportTicket } from '@/types/chat';

interface NotificationHandlerProps {
  setChatNotifications: (count: number) => void;
  setNotifications: (notifications: any[]) => void;
}

const NotificationHandler: React.FC<NotificationHandlerProps> = ({
  setChatNotifications,
  setNotifications,
}) => {
  useEffect(() => {
    const loadNotificationsFromStorage = () => {
      const storedNotifications = localStorage.getItem('notifications');
      if (storedNotifications) {
        try {
          const parsedNotifications = JSON.parse(storedNotifications);
          setNotifications(parsedNotifications);
        } catch (error) {
          console.error("Error parsing notifications:", error);
          initializeDefaultNotifications();
        }
      } else {
        initializeDefaultNotifications();
      }
    };
    
    const initializeDefaultNotifications = () => {
      const defaultNotifications = [
        {
          id: 'team-activity-1',
          userId: '2',
          userName: 'Jane Sprinter',
          userAvatar: '/placeholder.svg',
          clubId: '1',
          clubName: 'Weekend Warriors',
          distance: 5.2,
          timestamp: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
          read: false,
          type: 'activity'
        },
        {
          id: 'club-invite-1',
          userId: '7',
          userName: 'Alice Sprint',
          userAvatar: '/placeholder.svg',
          clubId: 'ac2',
          clubName: 'Hill Climbers',
          distance: 0,
          timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
          read: false,
          type: 'invitation',
          message: 'invited you to join'
        }
      ];
      setNotifications(defaultNotifications);
      localStorage.setItem('notifications', JSON.stringify(defaultNotifications));
    };
    
    const handleUnreadMessagesUpdated = () => {
      const unreadMessages = localStorage.getItem('unreadMessages');
      if (unreadMessages) {
        try {
          const unreadMap = JSON.parse(unreadMessages);
          const totalUnread = Object.values(unreadMap).reduce(
            (sum: number, count: unknown) => sum + (typeof count === 'number' ? count : 0), 
            0
          );
          setChatNotifications(Number(totalUnread));
        } catch (error) {
          console.error("Error parsing unread messages:", error);
          setChatNotifications(0);
        }
      } else {
        setChatNotifications(0);
      }
    };
    
    loadNotificationsFromStorage();
    
    window.addEventListener('unreadMessagesUpdated', handleUnreadMessagesUpdated);
    window.addEventListener('focus', handleUnreadMessagesUpdated);
    window.addEventListener('notificationsUpdated', loadNotificationsFromStorage);
    
    const checkInterval = setInterval(handleUnreadMessagesUpdated, 1000);
    
    return () => {
      window.removeEventListener('unreadMessagesUpdated', handleUnreadMessagesUpdated);
      window.removeEventListener('focus', handleUnreadMessagesUpdated);
      window.removeEventListener('notificationsUpdated', loadNotificationsFromStorage);
      clearInterval(checkInterval);
    };
  }, [setChatNotifications, setNotifications]);

  return null;
};

export default NotificationHandler;
