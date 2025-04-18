
import React from 'react';
import { useNotifications } from '@/hooks/useNotifications';
import { useChatNotifications } from '@/hooks/useChatNotifications';

interface NotificationHandlerProps {
  setChatNotifications: (count: number) => void;
  setNotifications: (notifications: any[]) => void;
}

const NotificationHandler: React.FC<NotificationHandlerProps> = ({
  setChatNotifications,
  setNotifications,
}) => {
  useNotifications({ setNotifications });
  useChatNotifications({ setChatNotifications });

  return null;
};

export default NotificationHandler;
