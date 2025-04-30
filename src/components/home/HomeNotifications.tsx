
import React, { useEffect } from 'react';
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
  // Set up real-time listener for the notifications table
  useEffect(() => {
    const setupNotificationListener = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log("[HomeNotifications] No user found, skipping notification listener setup");
        return;
      }
      
      console.log("[HomeNotifications] Setting up notification listener for user:", user.id);
      
      // Initial notifications fetch
      const initialNotifications = await refreshNotifications();
      if (initialNotifications) {
        console.log("[HomeNotifications] Setting initial notifications:", initialNotifications.length);
        setNotifications(initialNotifications);
      }
      
      const channel = supabase
        .channel('notifications-channel')
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
            const updatedNotifications = await refreshNotifications();
            if (updatedNotifications) {
              console.log("[HomeNotifications] Setting updated notifications:", updatedNotifications.length);
              setNotifications(updatedNotifications);
              
              // Show toast for new notifications
              if (payload.eventType === 'INSERT') {
                toast({
                  title: "New notification",
                  description: payload.new.message || "You have a new notification",
                });
              }
            }
          }
        )
        .subscribe((status) => {
          console.log("[HomeNotifications] Subscription status:", status);
        });
        
      console.log("[HomeNotifications] Notification listener set up successfully");
      
      return () => {
        console.log("[HomeNotifications] Cleaning up notification listener");
        supabase.removeChannel(channel);
      };
    };
    
    setupNotificationListener();
  }, [setNotifications]);

  return (
    <NotificationHandler 
      setChatNotifications={setChatNotifications}
      setNotifications={setNotifications}
    />
  );
};

export default HomeNotifications;
