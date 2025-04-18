
import { useState, useCallback, useEffect } from 'react';
import { Notification } from '@/types';
import { handleNotification } from '@/lib/notificationUtils';
import { toast } from "@/hooks/use-toast";

export const useHomeNotifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadMessages, setUnreadMessages] = useState(0);

  const handleMarkAsRead = useCallback((id: string) => {
    console.log("Marking notification as read:", id);
    const updatedNotifications = handleNotification(id, 'read');
    
    if (updatedNotifications) {
      setNotifications(updatedNotifications);
    }
  }, []);

  const handleDeclineInvite = useCallback((id: string) => {
    console.log("Declining invitation:", id);
    const updatedNotifications = handleNotification(id, 'delete');
    
    if (updatedNotifications) {
      setNotifications(updatedNotifications);
      
      toast({
        title: "Invitation Declined",
        description: "The club invitation has been declined."
      });
    }
  }, []);

  const handleClearAllNotifications = useCallback(() => {
    console.log("Clearing all notifications");
    localStorage.setItem('notifications', JSON.stringify([]));
    setNotifications([]);
    
    const event = new CustomEvent('notificationsUpdated');
    window.dispatchEvent(event);
    
    toast({
      title: "Notifications Cleared",
      description: "All notifications have been cleared."
    });
  }, []);

  // Load unread chat message counts from localStorage
  useEffect(() => {
    const handleUnreadMessagesUpdated = () => {
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

    // Initial load
    handleUnreadMessagesUpdated();
    
    // Set up listeners
    window.addEventListener('unreadMessagesUpdated', handleUnreadMessagesUpdated);
    
    return () => {
      window.removeEventListener('unreadMessagesUpdated', handleUnreadMessagesUpdated);
    };
  }, []);

  return {
    notifications,
    setNotifications,
    unreadMessages,
    setUnreadMessages,
    handleMarkAsRead,
    handleDeclineInvite,
    handleClearAllNotifications
  };
};
