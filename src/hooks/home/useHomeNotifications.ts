
import { useState, useEffect } from 'react';
import { toast } from '@/hooks/use-toast';
import { refreshNotifications } from '@/lib/notificationUtils';

export const useHomeNotifications = () => {
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [notifications, setNotifications] = useState<any[]>([]);

  const handleMarkAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === id ? { ...notification, read: true } : notification
      )
    );
    
    const storedNotifications = localStorage.getItem('notifications');
    if (storedNotifications) {
      try {
        const parsedNotifications = JSON.parse(storedNotifications);
        const updatedNotifications = parsedNotifications.map((notification: any) => 
          notification.id === id ? { ...notification, read: true } : notification
        );
        localStorage.setItem('notifications', JSON.stringify(updatedNotifications));
        
        const event = new CustomEvent('notificationsUpdated');
        window.dispatchEvent(event);
      } catch (error) {
        console.error("Error updating notification:", error);
      }
    }
  };

  const handleDeclineInvite = (id: string) => {
    const notification = notifications.find(n => n.id === id);
    const clubName = notification?.clubName || "the club";
    
    setNotifications(prev => prev.filter(notification => notification.id !== id));
    
    const storedNotifications = localStorage.getItem('notifications');
    if (storedNotifications) {
      try {
        const parsedNotifications = JSON.parse(storedNotifications);
        const updatedNotifications = parsedNotifications.filter(
          (n: any) => n.id !== id
        );
        localStorage.setItem('notifications', JSON.stringify(updatedNotifications));
        
        const event = new CustomEvent('notificationsUpdated');
        window.dispatchEvent(event);
        
        toast({
          title: "Invitation Declined",
          description: `You have declined the invitation to join ${clubName}`
        });
      } catch (error) {
        console.error("Error declining invitation:", error);
      }
    }
  };

  const handleClearAllNotifications = () => {
    setNotifications([]);
    localStorage.setItem('notifications', JSON.stringify([]));
    
    const event = new CustomEvent('notificationsUpdated');
    window.dispatchEvent(event);
    
    toast({
      title: "Notifications Cleared",
      description: "All notifications have been cleared"
    });
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
