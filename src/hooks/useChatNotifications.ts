
import { useEffect, useRef } from 'react';
import { useUnreadMessages } from '@/context/unread-messages';

interface UseChatNotificationsProps {
  setChatNotifications: (count: number) => void;
}

export const useChatNotifications = ({ setChatNotifications }: UseChatNotificationsProps) => {
  const { totalUnreadCount, forceRefresh } = useUnreadMessages();
  const previousCountRef = useRef(totalUnreadCount);
  
  // Update the chat notification count whenever totalUnreadCount changes
  useEffect(() => {
    console.log('[useChatNotifications] Total unread count updated:', totalUnreadCount);
    
    // Only update if the count has actually changed
    if (totalUnreadCount !== previousCountRef.current) {
      setChatNotifications(totalUnreadCount);
      previousCountRef.current = totalUnreadCount;
    }
  }, [totalUnreadCount, setChatNotifications]);

  // Listen for global unread message events to ensure UI updates
  useEffect(() => {
    const handleUnreadMessagesUpdate = () => {
      console.log('[useChatNotifications] Detected unreadMessagesUpdated event');
      // Force a refresh of the unread messages context
      setTimeout(() => {
        forceRefresh();
      }, 10); // Reduced timeout for faster UI updates
    };
    
    const handleClubMessageReceived = (event: CustomEvent) => {
      console.log('[useChatNotifications] Detected clubMessageReceived event for club:', event.detail?.clubId);
      // Force a refresh immediately when a club message is received
      forceRefresh();
    };
    
    window.addEventListener('unreadMessagesUpdated', handleUnreadMessagesUpdate);
    window.addEventListener('clubMessageReceived', handleClubMessageReceived as EventListener);
    
    return () => {
      window.removeEventListener('unreadMessagesUpdated', handleUnreadMessagesUpdate);
      window.removeEventListener('clubMessageReceived', handleClubMessageReceived as EventListener);
    };
  }, [forceRefresh]);
};
