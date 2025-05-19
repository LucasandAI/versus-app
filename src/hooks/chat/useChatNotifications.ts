
import { useEffect, useCallback } from 'react';
import { useUnreadMessages } from '@/context/unread-messages';

interface UseChatNotificationsProps {
  setChatNotifications: (count: number) => void;
}

export const useChatNotifications = ({ setChatNotifications }: UseChatNotificationsProps) => {
  const { totalUnreadCount, refreshUnreadCounts } = useUnreadMessages();
  
  // Force refresh unread counts on various events
  const handleNotificationsUpdate = useCallback(async () => {
    console.log('[useChatNotifications] Notification update event received, refreshing counts');
    await refreshUnreadCounts();
  }, [refreshUnreadCounts]);
  
  // Listen for events that should trigger a refresh of unread counts
  useEffect(() => {
    const events = [
      'unreadMessagesUpdated',
      'messagesMarkedAsRead',
      'activeConversationChanged'
    ];
    
    // Add listeners for all events
    events.forEach(eventName => {
      window.addEventListener(eventName, handleNotificationsUpdate);
    });
    
    // Add visibility change listener to refresh when tab becomes visible
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('[useChatNotifications] Tab became visible, refreshing unread counts');
        refreshUnreadCounts();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      // Remove all event listeners on cleanup
      events.forEach(eventName => {
        window.removeEventListener(eventName, handleNotificationsUpdate);
      });
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [handleNotificationsUpdate, refreshUnreadCounts]);
  
  // Update the chat notification count whenever totalUnreadCount changes
  useEffect(() => {
    console.log('[useChatNotifications] Total unread count changed:', totalUnreadCount);
    setChatNotifications(totalUnreadCount);
  }, [totalUnreadCount, setChatNotifications]);
};
