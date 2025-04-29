
import { useEffect } from 'react';

interface UseChatNotificationsProps {
  setChatNotifications: (count: number) => void;
}

export const useChatNotifications = ({ setChatNotifications }: UseChatNotificationsProps) => {
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
          setChatNotifications(Number(totalUnread));
        } catch (error) {
          console.error("Error parsing unread messages:", error);
          setChatNotifications(0);
        }
      } else {
        setChatNotifications(0);
      }
    };

    const handleClubMessagesRead = (event: CustomEvent) => {
      if (event.detail?.clubId) {
        // Update the notification count since we've read messages
        handleUnreadMessagesUpdated();
      }
    };
    
    const handleClubMessageReceived = (event: CustomEvent) => {
      if (event.detail?.clubId) {
        // Update the notification count since we've received a new message
        handleUnreadMessagesUpdated();
      }
    };

    handleUnreadMessagesUpdated(); // Initial check
    
    window.addEventListener('unreadMessagesUpdated', handleUnreadMessagesUpdated);
    window.addEventListener('focus', handleUnreadMessagesUpdated);
    window.addEventListener('clubMessagesRead', handleClubMessagesRead as EventListener);
    window.addEventListener('clubMessageReceived', handleClubMessageReceived as EventListener);
    
    const checkInterval = setInterval(handleUnreadMessagesUpdated, 1000);
    
    return () => {
      window.removeEventListener('unreadMessagesUpdated', handleUnreadMessagesUpdated);
      window.removeEventListener('focus', handleUnreadMessagesUpdated);
      window.removeEventListener('clubMessagesRead', handleClubMessagesRead as EventListener);
      window.removeEventListener('clubMessageReceived', handleClubMessageReceived as EventListener);
      clearInterval(checkInterval);
    };
  }, [setChatNotifications]);
};
