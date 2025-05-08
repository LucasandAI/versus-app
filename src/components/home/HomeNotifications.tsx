
import React, { useEffect } from 'react';
import { useUnreadMessages } from '@/context/UnreadMessagesContext';
import { useChatNotifications } from '@/hooks/useChatNotifications';

interface HomeNotificationsProps {
  setChatNotifications: (count: number) => void;
  setNotifications: React.Dispatch<React.SetStateAction<any[]>>;
}

const HomeNotifications: React.FC<HomeNotificationsProps> = ({
  setChatNotifications,
  setNotifications
}) => {
  // Use the unread messages context to get the total count
  const { totalUnreadCount, clubUnreadCounts, directMessageUnreadCounts, refreshUnreadCounts } = useUnreadMessages();
  
  // Update the chat notification count using our hook
  useChatNotifications({ setChatNotifications });
  
  // Initial fetch of unread counts
  useEffect(() => {
    refreshUnreadCounts();
    
    // Set up a listener for real-time unread count updates
    const handleUnreadMessagesUpdated = () => {
      refreshUnreadCounts();
    };
    
    window.addEventListener('unreadMessagesUpdated', handleUnreadMessagesUpdated);
    
    return () => {
      window.removeEventListener('unreadMessagesUpdated', handleUnreadMessagesUpdated);
    };
  }, [refreshUnreadCounts]);

  return null; // This component doesn't render anything, it just handles state updates
};

export default HomeNotifications;
