
import React, { useEffect } from 'react';
import { Club } from '@/types';
import HomeNotifications from './HomeNotifications';
import ChatDrawerHandler from './ChatDrawerHandler';
import { useHomeNotifications } from '@/hooks/home/useHomeNotifications';
import { supabase } from '@/integrations/supabase/client';
import { useApp } from '@/context/AppContext';
import { useUnreadMessages } from '@/context/UnreadMessagesContext';

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
  const { markClubAsUnread, markConversationAsUnread, fetchUnreadCounts } = useUnreadMessages();
  const {
    notifications,
    setNotifications,
    updateUnreadCount,
  } = useHomeNotifications();

  // Fetch unread counts on mount
  useEffect(() => {
    if (currentUser?.id) {
      fetchUnreadCounts();
    }
  }, [currentUser?.id, fetchUnreadCounts]);

  // Listen for real-time chat messages
  useEffect(() => {
    if (!currentUser || !userClubs.length) return;
    
    // Get club IDs for subscription filter
    const clubIds = userClubs.map(club => club.id);
    
    // Subscribe to club messages for the user's clubs
    const clubChannel = supabase
      .channel('home-chat-updates')
      .on(
        'postgres_changes',
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'club_chat_messages',
          filter: `club_id=in.(${clubIds.map(id => `'${id}'`).join(',')})` 
        },
        (payload) => {
          if (payload.new.sender_id !== currentUser.id) {
            const clubId = payload.new.club_id;
            markClubAsUnread(clubId);
          }
        }
      )
      .subscribe();
    
    // Subscribe to direct messages
    const dmChannel = supabase
      .channel('home-dm-updates')
      .on(
        'postgres_changes',
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'direct_messages',
          filter: `receiver_id=eq.${currentUser.id}`
        },
        (payload) => {
          if (payload.new.sender_id !== currentUser.id) {
            markConversationAsUnread(payload.new.conversation_id);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(clubChannel);
      supabase.removeChannel(dmChannel);
    };
  }, [currentUser, userClubs, markClubAsUnread, markConversationAsUnread]);

  return (
    <>
      <HomeNotifications
        setChatNotifications={updateUnreadCount}
        setNotifications={setNotifications}
      />

      <ChatDrawerHandler 
        userClubs={userClubs}
        onSelectUser={onSelectUser}
      />
    </>
  );
};

export default HomeNotificationsHandler;
