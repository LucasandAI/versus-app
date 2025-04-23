
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { handleNotification, markAllNotificationsAsRead } from '@/utils/notification-actions';

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
        // Load notifications from Supabase
        const { data, error } = await supabase
          .from('notifications')
          .select('*')
          .order('created_at', { ascending: false });
          
        if (error) {
          console.error("Error loading notifications from Supabase:", error);
          setNotifications([]);
        } else {
          setNotifications(data || []);
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

  // Add the methods needed by HomeView.tsx
  const handleMarkAsRead = async (id: string) => {
    try {
      // Update in Supabase
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', id);
        
      if (error) {
        console.error("Error marking notification as read:", error);
        return;
      }
      
      // Update local state
      setNotifications(prevNotifications => 
        prevNotifications.map(notification => 
          notification.id === id ? { ...notification, read: true } : notification
        )
      );
    } catch (error) {
      console.error("Error in handleMarkAsRead:", error);
    }
  };

  const handleDeclineInvite = async (id: string) => {
    try {
      // Delete from Supabase
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', id);
        
      if (error) {
        console.error("Error declining invitation:", error);
        return;
      }
      
      // Update local state
      setNotifications(prevNotifications => 
        prevNotifications.filter(notification => notification.id !== id)
      );
    } catch (error) {
      console.error("Error in handleDeclineInvite:", error);
    }
  };

  const handleClearAllNotifications = async () => {
    try {
      // Update all notifications to read in Supabase
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .is('read', false);
        
      if (error) {
        console.error("Error marking all notifications as read:", error);
        return;
      }
      
      // Update local state
      setNotifications(prevNotifications => 
        prevNotifications.map(notification => ({ ...notification, read: true }))
      );
    } catch (error) {
      console.error("Error in handleClearAllNotifications:", error);
    }
  };

  return {
    unreadMessages,
    setUnreadMessages,
    notifications,
    setNotifications,
    handleMarkAsRead,
    handleDeclineInvite,
    handleClearAllNotifications
  };
};
