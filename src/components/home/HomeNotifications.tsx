
import React, { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import NotificationHandler from './NotificationHandler';
import { refreshNotifications } from '@/lib/notificationUtils';

interface HomeNotificationsProps {
  setChatNotifications: (count: number) => void;
  setNotifications: React.Dispatch<React.SetStateAction<any[]>>;
}

const HomeNotifications: React.FC<HomeNotificationsProps> = ({
  setChatNotifications,
  setNotifications
}) => {
  // Set up real-time listener for the notifications table
  useEffect(() => {
    const setupNotificationListener = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      console.log("[HomeNotifications] Setting up notification listener for user:", user.id);
      
      const channel = supabase
        .channel('public:notifications')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${user.id}`
          },
          async (payload) => {
            console.log("[HomeNotifications] Notification change detected:", payload);
            // Refresh notifications when any change happens
            await refreshNotifications();
            const event = new CustomEvent('notificationsUpdated');
            window.dispatchEvent(event);
          }
        )
        .subscribe();
        
      console.log("[HomeNotifications] Notification listener set up successfully");
      
      return () => {
        supabase.removeChannel(channel);
      };
    };
    
    setupNotificationListener();
  }, []);

  return (
    <NotificationHandler 
      setChatNotifications={setChatNotifications}
      setNotifications={setNotifications}
    />
  );
};

export default HomeNotifications;
