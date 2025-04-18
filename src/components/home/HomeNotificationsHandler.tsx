
import React from 'react';
import { Club } from '@/types';
import HomeNotifications from './HomeNotifications';
import ChatDrawerHandler from './ChatDrawerHandler';
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
  } = useHomeNotifications();

  return (
    <>
      <HomeNotifications
        setChatNotifications={setUnreadMessages}
        setNotifications={setNotifications}
      />

      <ChatDrawerHandler 
        userClubs={userClubs}
        onSelectUser={onSelectUser}
        supportTickets={supportTickets}
        setUnreadMessages={setUnreadMessages}
      />
    </>
  );
};

export default HomeNotificationsHandler;

