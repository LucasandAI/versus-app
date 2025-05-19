
import { useEffect, useCallback } from 'react';
import { useUnreadMessages } from '@/context/unread-messages';

interface UseChatNotificationsProps {
  setChatNotifications: (count: number) => void;
}

export const useChatNotifications = ({ setChatNotifications }: UseChatNotificationsProps) => {
  const { totalUnreadCount, refreshUnreadCounts } = useUnreadMessages();
  
  // Force refresh unread counts on unreadMessagesUpdated event
  const handleUnreadMessagesUpdated = useCallback(async () => {
    console.log('[useChatNotifications] Unread messages updated event received, refreshing counts');
    
    // This will cause the totalUnreadCount to update, which will trigger the effect below
    await refreshUnreadCounts();
  }, [refreshUnreadCounts]);
  
  // Listen for events that should trigger a refresh of unread counts
  useEffect(() => {
    window.addEventListener('unreadMessagesUpdated', handleUnreadMessagesUpdated);
    
    return () => {
      window.removeEventListener('unreadMessagesUpdated', handleUnreadMessagesUpdated);
    };
  }, [handleUnreadMessagesUpdated]);
  
  // Update the chat notification count whenever totalUnreadCount changes
  useEffect(() => {
    console.log('[useChatNotifications] Total unread count changed:', totalUnreadCount);
    setChatNotifications(totalUnreadCount);
  }, [totalUnreadCount, setChatNotifications]);
};
