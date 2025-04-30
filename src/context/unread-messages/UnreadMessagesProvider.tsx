
import React, { useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import UnreadMessagesContext from './UnreadMessagesContext';
import { useDirectMessageUnreadState } from './hooks/useDirectMessageUnreadState';
import { useClubUnreadState } from './hooks/useClubUnreadState';
import { useFetchUnreadCounts } from './hooks/useFetchUnreadCounts';
import { useUnreadSubscriptions } from './hooks/useUnreadSubscriptions';

export const UnreadMessagesProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const { currentUser, isSessionReady } = useApp();
  
  // State for unread tracking from hooks
  const {
    unreadConversations,
    setUnreadConversations,
    dmUnreadCount,
    setDmUnreadCount,
    markConversationAsUnread,
    markConversationAsRead
  } = useDirectMessageUnreadState(currentUser?.id);
  
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
  
  // Fetch unread counts
  const { fetchUnreadCounts } = useFetchUnreadCounts({
    currentUserId: currentUser?.id,
    isSessionReady,
    setDmUnreadCount,
    setClubUnreadCount,
    setUnreadConversations,
    setUnreadClubs
  });
  
  // Set up real-time subscriptions
  useUnreadSubscriptions({
    currentUserId: currentUser?.id,
    isSessionReady,
    markConversationAsUnread,
    markClubAsUnread,
    fetchUnreadCounts
  });
  
  // Debug: Add effect to log the contents of unreadClubs whenever it changes
  useEffect(() => {
    console.log('[UnreadMessagesProvider] unreadClubs updated:', Array.from(unreadClubs));
  }, [unreadClubs]);
  
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
