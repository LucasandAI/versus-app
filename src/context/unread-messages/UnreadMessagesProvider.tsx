
import React, { useEffect, useCallback, useMemo, useRef } from 'react';
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
  
  // Combined total - memoize to avoid re-renders
  const totalUnreadCount = useMemo(() => 
    dmUnreadCount + clubUnreadCount,
    [dmUnreadCount, clubUnreadCount]
  );
  
  // Store values in refs to avoid stale closures
  const stateRef = useRef({
    unreadConversations,
    dmUnreadCount, 
    unreadMessagesPerConversation,
    unreadClubs,
    clubUnreadCount,
    unreadMessagesPerClub,
    totalUnreadCount
  });
  
  // Update ref when values change
  useEffect(() => {
    stateRef.current = {
      unreadConversations,
      dmUnreadCount,
      unreadMessagesPerConversation,
      unreadClubs, 
      clubUnreadCount,
      unreadMessagesPerClub,
      totalUnreadCount
    };
  }, [
    unreadConversations, dmUnreadCount, unreadMessagesPerConversation,
    unreadClubs, clubUnreadCount, unreadMessagesPerClub, totalUnreadCount
  ]);
  
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
  
  // Set up real-time subscriptions
  useUnreadSubscriptions({
    currentUserId: currentUser?.id,
    isSessionReady,
    markConversationAsUnread,
    markClubAsUnread,
    fetchUnreadCounts
  });
  
  // Listen for global unread messages events with stable handler
  useEffect(() => {
    const handler = () => {
      console.log('[UnreadMessagesProvider] Handling unreadMessagesUpdated event');
      // We don't need to do anything here - the individual hooks handle their own state
    };
    
    window.addEventListener('unreadMessagesUpdated', handler);
    return () => window.removeEventListener('unreadMessagesUpdated', handler);
  }, []);
  
  // Force re-render method that components can call - memoized
  const forceRefresh = useCallback(() => {
    console.log('[UnreadMessagesProvider] Force refresh triggered');
    // Use state from ref to avoid closure issues
    setUnreadClubs(new Set(stateRef.current.unreadClubs));
  }, [setUnreadClubs]);
  
  // Memoize context value to prevent unnecessary re-renders of consumers
  const contextValue = useMemo(() => ({
    unreadConversations,
    dmUnreadCount,
    unreadMessagesPerConversation,
    unreadClubs,
    clubUnreadCount,
    unreadMessagesPerClub,
    totalUnreadCount,
    forceRefresh, // Include the forceRefresh function in the context value
    markConversationAsRead,
    markClubMessagesAsRead,
    markConversationAsUnread,
    markClubAsUnread,
    fetchUnreadCounts
  }), [
    unreadConversations, dmUnreadCount, unreadMessagesPerConversation,
    unreadClubs, clubUnreadCount, unreadMessagesPerClub, totalUnreadCount,
    forceRefresh, // Add to dependency array as well
    markConversationAsRead, markClubMessagesAsRead, markConversationAsUnread, markClubAsUnread,
    fetchUnreadCounts
  ]);
  
  return (
    <UnreadMessagesContext.Provider value={contextValue}>
      {children}
    </UnreadMessagesContext.Provider>
  );
};
