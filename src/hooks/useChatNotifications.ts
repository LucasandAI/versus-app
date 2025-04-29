
import { useEffect } from 'react';
import { useUnreadMessages } from '@/context/UnreadMessagesContext';

interface UseChatNotificationsProps {
  setChatNotifications: (count: number) => void;
}

export const useChatNotifications = ({ setChatNotifications }: UseChatNotificationsProps) => {
  const { totalUnreadCount } = useUnreadMessages();
  
  // Update the chat notification count whenever totalUnreadCount changes
  useEffect(() => {
    setChatNotifications(totalUnreadCount);
  }, [totalUnreadCount, setChatNotifications]);
};
