
import React, { useEffect } from 'react';
import ChatDrawer from '../chat/ChatDrawer';
import { Club } from '@/types';
import HomeNotifications from './HomeNotifications';
import { useHomeNotifications } from '@/hooks/home/useHomeNotifications';

interface HomeNotificationsHandlerProps {
  userClubs: Club[];
  onJoinClub: (clubId: string, clubName: string) => void;
  onSelectUser: (userId: string, name: string) => void;
  supportTickets: any[];
}

const HomeNotificationsHandler: React.FC<HomeNotificationsHandlerProps> = ({
  userClubs,
  onJoinClub,
  onSelectUser,
  supportTickets
}) => {
  const {
    unreadMessages,
    setUnreadMessages,
    notifications,
    setNotifications,
    handleMarkAsRead,
    handleDeclineInvite,
    handleClearAllNotifications
  } = useHomeNotifications();

  const [chatDrawerOpen, setChatDrawerOpen] = React.useState(false);

  useEffect(() => {
    const loadUnreadCounts = () => {
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
      }
    };

    loadUnreadCounts();
    
    const handleUnreadMessagesUpdated = () => loadUnreadCounts();
    
    window.addEventListener('unreadMessagesUpdated', handleUnreadMessagesUpdated);
    window.addEventListener('focus', handleUnreadMessagesUpdated);
    window.addEventListener('notificationsUpdated', handleUnreadMessagesUpdated);
    
    const checkInterval = setInterval(handleUnreadMessagesUpdated, 1000);
    
    return () => {
      window.removeEventListener('unreadMessagesUpdated', handleUnreadMessagesUpdated);
      window.removeEventListener('focus', handleUnreadMessagesUpdated);
      window.removeEventListener('notificationsUpdated', handleUnreadMessagesUpdated);
      clearInterval(checkInterval);
    };
  }, [setUnreadMessages]);

  return (
    <>
      <HomeNotifications
        setChatNotifications={setUnreadMessages}
        setNotifications={setNotifications}
      />

      <ChatDrawer 
        open={chatDrawerOpen} 
        onOpenChange={(open) => {
          setChatDrawerOpen(open);
          if (!open) {
            const event = new CustomEvent('chatDrawerClosed');
            window.dispatchEvent(event);
          }
        }} 
        clubs={userClubs}
        onNewMessage={(count) => setUnreadMessages(count)} 
        supportTickets={supportTickets}
      />
    </>
  );
};

export default HomeNotificationsHandler;
