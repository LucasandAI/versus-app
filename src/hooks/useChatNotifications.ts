
import { useEffect } from 'react';
import { useUnreadMessages } from '@/context/unread-messages';

interface UseChatNotificationsProps {
  setChatNotifications: (count: number) => void;
}

export const useChatNotifications = ({ setChatNotifications }: UseChatNotificationsProps) => {
  const { totalUnreadCount, forceRefresh } = useUnreadMessages();
  
  // Update the chat notification count whenever totalUnreadCount changes
  useEffect(() => {
    console.log('[useChatNotifications] Total unread count updated:', totalUnreadCount);
    setChatNotifications(totalUnreadCount);
  }, [totalUnreadCount, setChatNotifications]);

  // Listen for global unread message events to ensure UI updates
  useEffect(() => {
    const handleUnreadMessagesUpdate = () => {
      console.log('[useChatNotifications] Detected unreadMessagesUpdated event');
      // Force a refresh of the unread messages context
      setTimeout(() => {
        forceRefresh();
      }, 50);
    };
    
    window.addEventListener('unreadMessagesUpdated', handleUnreadMessagesUpdate);
    return () => {
      window.removeEventListener('unreadMessagesUpdated', handleUnreadMessagesUpdate);
    };
  }, [forceRefresh]);
};
