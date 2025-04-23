
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useHomeNotifications = () => {
  const [unreadMessages, setUnreadMessages] = useState<number>(0);
  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    const loadUnreadCounts = () => {
      // Load from localStorage for now until we implement Supabase
      const unreadMessages = localStorage.getItem('unreadMessages');
      if (unreadMessages) {
        try {
          const unreadMap = JSON.parse(unreadMessages);
          const totalUnread = Object.values(unreadMap).reduce(
            (sum: number, count: unknown) => sum + (typeof count === 'number' ? count : 0), 
            0
          );
          setUnreadMessages(Number(totalUnread));
        } catch (error) {
          console.error("Error parsing unread messages:", error);
          setUnreadMessages(0);
        }
      } else {
        setUnreadMessages(0);
      }
    };
    
    const loadNotifications = async () => {
      try {
        // Eventually pull from Supabase notifications table
        const savedNotifications = localStorage.getItem('notifications');
        if (savedNotifications) {
          setNotifications(JSON.parse(savedNotifications));
        } else {
          setNotifications([]);
        }
      } catch (error) {
        console.error("Error loading notifications:", error);
        setNotifications([]);
      }
    };
    
    loadUnreadCounts();
    loadNotifications();
    
    const handleMessagesUpdated = () => {
      loadUnreadCounts();
    };
    
    const handleNotificationsUpdated = () => {
      loadNotifications();
    };
    
    window.addEventListener('unreadMessagesUpdated', handleMessagesUpdated);
    window.addEventListener('notificationsUpdated', handleNotificationsUpdated);
    window.addEventListener('chatDrawerClosed', handleMessagesUpdated);
    
    return () => {
      window.removeEventListener('unreadMessagesUpdated', handleMessagesUpdated);
      window.removeEventListener('notificationsUpdated', handleNotificationsUpdated);
      window.removeEventListener('chatDrawerClosed', handleMessagesUpdated);
    };
  }, []);

  return {
    unreadMessages,
    setUnreadMessages,
    notifications,
    setNotifications,
  };
};
