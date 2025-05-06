
import React from 'react';
import NotificationHandler from './NotificationHandler';

interface HomeNotificationsProps {
  setChatNotifications: (count: number) => void;
  setNotifications: React.Dispatch<React.SetStateAction<any[]>>;
}

const HomeNotifications: React.FC<HomeNotificationsProps> = ({
  setChatNotifications,
  setNotifications
}) => {
  return (
    <NotificationHandler 
      setChatNotifications={setChatNotifications}
      setNotifications={setNotifications}
    />
  );
};

export default HomeNotifications;
