
import React, { useEffect, useCallback } from 'react';
import { useApp } from '@/context/AppContext';
import UnreadMessagesContext from './UnreadMessagesContext';
import { useDirectMessageUnreadState } from './hooks/useDirectMessageUnreadState';
import { useClubUnreadState } from './hooks/useClubUnreadState';
import { useFetchUnreadCounts } from './hooks/useFetchUnreadCounts';
import { useUnreadSubscriptions } from './hooks/useUnreadSubscriptions';
import { useInitialAppLoad } from '@/hooks/useInitialAppLoad';

export const UnreadMessagesProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const { currentUser, isSessionReady } = useApp();
  const isAppReady = useInitialAppLoad();
  
  // State for unread tracking from hooks
  const {
    unreadConversations,
    setUnreadConversations,
    dmUnreadCount,
    setDmUnreadCount,
    unreadMessagesPerConversation,
    setUnreadMessagesPerConversation,
    markConversationAsUnread,
    markConversationAsRead
  } = useDirectMessageUnreadState(currentUser?.id);
  
  const {
    unreadClubs,
    setUnreadClubs,
    clubUnreadCount,
    setClubUnreadCount,
    unreadMessagesPerClub,
    setUnreadMessagesPerClub,
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
    setUnreadClubs,
    setUnreadMessagesPerConversation,
    setUnreadMessagesPerClub
  });
  
  // Set up real-time subscriptions (only when app is ready)
  useUnreadSubscriptions({
    currentUserId: currentUser?.id,
    isSessionReady,
    isAppReady,
    markConversationAsUnread,
    markClubAsUnread,
    fetchUnreadCounts
  });
  
  // Listen for global unread messages events
  useEffect(() => {
    const handleUnreadMessagesUpdate = () => {
      console.log('[UnreadMessagesProvider] Handling unreadMessagesUpdated event');
      // Force a refresh of unread counts
      if (currentUser?.id && isSessionReady) {
        fetchUnreadCounts();
      }
    };
    
    window.addEventListener('unreadMessagesUpdated', handleUnreadMessagesUpdate);
    window.addEventListener('initialDataLoaded', handleUnreadMessagesUpdate);
    
    return () => {
      window.removeEventListener('unreadMessagesUpdated', handleUnreadMessagesUpdate);
      window.removeEventListener('initialDataLoaded', handleUnreadMessagesUpdate);
    };
  }, [fetchUnreadCounts, currentUser?.id, isSessionReady]);
  
  // Force re-render method that components can call
  const forceRefresh = useCallback(() => {
    console.log('[UnreadMessagesProvider] Force refresh triggered');
    // The state update will trigger a re-render
    setUnreadClubs(new Set(unreadClubs));
    
    // Dispatch global event to ensure other components update
    window.dispatchEvent(new CustomEvent('unreadMessagesUpdated'));
  }, [unreadClubs, setUnreadClubs]);
  
  return (
    <UnreadMessagesContext.Provider value={{
      unreadConversations,
      dmUnreadCount,
      unreadMessagesPerConversation,
      unreadClubs,
      clubUnreadCount,
      unreadMessagesPerClub,
      totalUnreadCount,
      markConversationAsRead,
      markClubMessagesAsRead,
      markConversationAsUnread,
      markClubAsUnread,
      fetchUnreadCounts,
      forceRefresh
    }}>
      {children}
    </UnreadMessagesContext.Provider>
  );
};
