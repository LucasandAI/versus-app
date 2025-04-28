
import React, { useEffect } from 'react';
import { Club } from '@/types';
import HomeNotifications from './HomeNotifications';
import ChatDrawerHandler from './ChatDrawerHandler';
import { useHomeNotifications } from '@/hooks/home/useHomeNotifications';
import { supabase } from '@/integrations/supabase/client';
import { useApp } from '@/context/AppContext';
import { useUnreadCounts } from '@/hooks/chat/useUnreadCounts';

interface HomeNotificationsHandlerProps {
  userClubs: Club[];
  onJoinClub: (clubId: string, clubName: string) => void;
  onSelectUser: (userId: string, name: string) => void;
}

const HomeNotificationsHandler: React.FC<HomeNotificationsHandlerProps> = ({
  userClubs,
  onJoinClub,
  onSelectUser
}) => {
  const { currentUser } = useApp();
  const {
    unreadMessages,
    setUnreadMessages,
    notifications,
    setNotifications,
  } = useHomeNotifications();
  
  // Get club unread status separately
  const { markClubAsRead } = useUnreadCounts(currentUser?.id);

  // Listen for real-time chat messages
  useEffect(() => {
    if (!currentUser || !userClubs.length) return;
    
    const userClubIds = userClubs.map(club => club.id);
    
    // Subscribe to club messages for the user's clubs
    const channel = supabase
      .channel('chat-updates')
      .on(
        'postgres_changes',
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'club_chat_messages'
        },
        (payload) => {
          // Only process if the message is for one of the user's clubs
          if (
            payload.new.club_id && 
            userClubIds.includes(payload.new.club_id) && 
            payload.new.sender_id !== currentUser.id
          ) {
            // Update unread count if the message is not from current user
            const clubId = payload.new.club_id;
            
            // Dispatch event to update unread messages
            const event = new CustomEvent('unreadMessagesUpdated', { 
              detail: { clubId }
            });
            window.dispatchEvent(event);
            
            // Dispatch club-specific unread event
            const clubEvent = new CustomEvent('clubUnreadMessagesUpdated', { 
              detail: { clubId }
            });
            window.dispatchEvent(clubEvent);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUser, userClubs]);

  return (
    <>
      <HomeNotifications
        setChatNotifications={setUnreadMessages}
        setNotifications={setNotifications}
      />

      <ChatDrawerHandler 
        userClubs={userClubs}
        onSelectUser={onSelectUser}
        setUnreadMessages={setUnreadMessages}
      />
    </>
  );
};

export default HomeNotificationsHandler;
