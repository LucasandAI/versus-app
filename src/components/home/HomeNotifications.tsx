
import React from 'react';
import { useNotifications } from '@/hooks/useNotifications';
import { useChatNotifications } from '@/hooks/useChatNotifications';
import NotificationHandler from './NotificationHandler';

interface HomeNotificationsProps {
  setChatNotifications: (count: number) => void;
  setNotifications: React.Dispatch<React.SetStateAction<any[]>>;
}

const HomeNotifications: React.FC<HomeNotificationsProps> = ({
  setChatNotifications,
  setNotifications
}) => {
  useNotifications({ setNotifications });
  useChatNotifications({ setChatNotifications });

  return (
    <NotificationHandler 
      setChatNotifications={setChatNotifications}
      setNotifications={setNotifications}
    />
  );
};

export default HomeNotifications;
