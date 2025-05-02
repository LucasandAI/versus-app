
import React from 'react';
import { supabase } from '@/integrations/supabase/client';
import NotificationHandler from './NotificationHandler';
import { refreshNotifications } from '@/lib/notificationUtils';
import { toast } from '@/hooks/use-toast';

interface HomeNotificationsProps {
  setChatNotifications: (count: number) => void;
  setNotifications: React.Dispatch<React.SetStateAction<any[]>>;
}

const HomeNotifications: React.FC<HomeNotificationsProps> = ({
  setChatNotifications,
  setNotifications
}) => {
  // Initial notifications fetch happens in NotificationHandler and useHomeNotifications
  // We no longer need the real-time listener here since it's moved to useHomeNotifications
  
  return (
    <NotificationHandler 
      setChatNotifications={setChatNotifications}
      setNotifications={setNotifications}
    />
  );
};

export default HomeNotifications;
