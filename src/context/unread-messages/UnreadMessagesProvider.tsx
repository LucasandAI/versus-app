
import React, { useEffect, useCallback, useState } from 'react';
import { useApp } from '@/context/AppContext';
import UnreadMessagesContext from './UnreadMessagesContext';
import { useDirectMessageUnreadState } from './hooks/useDirectMessageUnreadState';
import { useClubUnreadState } from './hooks/useClubUnreadState';
import { useFetchUnreadCounts } from './hooks/useFetchUnreadCounts';
import { useUnreadSubscriptions } from './hooks/useUnreadSubscriptions';

export const UnreadMessagesProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const { currentUser, isSessionReady } = useApp();
  const [forceUpdateTrigger, setForceUpdateTrigger] = useState(0);
  
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
  
  // Set up real-time subscriptions
  useUnreadSubscriptions({
    currentUserId: currentUser?.id,
    isSessionReady,
    markConversationAsUnread,
    markClubAsUnread,
    fetchUnreadCounts
  });
  
  // Listen for global unread messages events
  useEffect(() => {
    const handler = () => {
      console.log('[UnreadMessagesProvider] Handling unreadMessagesUpdated event');
      setForceUpdateTrigger(prev => prev + 1);
    };
    
    window.addEventListener('unreadMessagesUpdated', handler);
    return () => window.removeEventListener('unreadMessagesUpdated', handler);
  }, []);
  
  // Debug: Add effect to log the contents of unreadClubs whenever it changes
  useEffect(() => {
    console.log('[UnreadMessagesProvider] unreadClubs updated:', Array.from(unreadClubs));
    console.log('[UnreadMessagesProvider] clubUnreadCount:', clubUnreadCount);
    console.log('[UnreadMessagesProvider] totalUnreadCount:', totalUnreadCount);
  }, [unreadClubs, clubUnreadCount, totalUnreadCount]);
  
  // Force re-render method that components can call
  const forceRefresh = useCallback(() => {
    console.log('[UnreadMessagesProvider] Force refresh triggered');
    setForceUpdateTrigger(prev => prev + 1);
    
    // Create new Set instances to ensure state updates are detected
    setUnreadClubs(new Set(unreadClubs));
    setUnreadConversations(new Set(unreadConversations));
    
    // Also force update the count values to ensure they're refreshed
    setClubUnreadCount(prev => {
      // This forces a re-render even if the value is the same
      return prev;
    });
  }, [unreadClubs, unreadConversations, setUnreadClubs, setUnreadConversations, setClubUnreadCount]);
  
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
