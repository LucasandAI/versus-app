
import React from 'react';
import { useApp } from '../AppContext';
import UnreadMessagesContext from './UnreadMessagesContext';
import { useDMUnreadState } from './useDMUnreadState';
import { useClubUnreadState } from './useClubUnreadState';
import { useFetchUnreadCounts } from './useFetchUnreadCounts';
import { useUnreadSubscriptions } from './useUnreadSubscriptions';

export const UnreadMessagesProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const { currentUser, isSessionReady } = useApp();
  
  // Get DM unread state
  const {
    unreadConversations,
    setUnreadConversations,
    dmUnreadCount,
    setDmUnreadCount,
    markConversationAsUnread,
    markConversationAsRead
  } = useDMUnreadState(currentUser?.id);
  
  // Get Club unread state
  const {
    unreadClubs,
    setUnreadClubs,
    clubUnreadCount,
    setClubUnreadCount,
    markClubAsUnread,
    markClubMessagesAsRead
  } = useClubUnreadState(currentUser?.id);
  
  // Combined total
  const totalUnreadCount = dmUnreadCount + clubUnreadCount;
  
  // Fetch unread counts from the server
  const { fetchUnreadCounts } = useFetchUnreadCounts({
    userId: currentUser?.id,
    setDmUnreadCount,
    setClubUnreadCount,
    setUnreadConversations,
    setUnreadClubs
  });
  
  // Set up real-time subscriptions
  useUnreadSubscriptions({
    userId: currentUser?.id,
    isSessionReady,
    markConversationAsUnread,
    markClubAsUnread
  });

  return (
    <UnreadMessagesContext.Provider value={{
      unreadConversations,
      dmUnreadCount,
      unreadClubs,
      clubUnreadCount,
      totalUnreadCount,
      markConversationAsRead,
      markClubMessagesAsRead,
      markConversationAsUnread,
      markClubAsUnread,
      fetchUnreadCounts
    }}>
      {children}
    </UnreadMessagesContext.Provider>
  );
};
