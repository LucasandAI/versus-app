
import React, { useEffect, useCallback, useState } from 'react';
import { useApp } from '@/context/AppContext';
import UnreadMessagesContext from './UnreadMessagesContext';
import { useDirectMessageUnreadState } from './hooks/useDirectMessageUnreadState';
import { useClubUnreadState } from './hooks/useClubUnreadState';
import { useFetchUnreadCounts } from './hooks/useFetchUnreadCounts';
import { useUnreadSubscriptions } from './hooks/useUnreadSubscriptions';

export const UnreadMessagesProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const { currentUser, isSessionReady } = useApp();
  const [refreshToggle, setRefreshToggle] = useState(false);
  
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
    const handleUnreadMessagesUpdated = () => {
      console.log('[UnreadMessagesProvider] Handling unreadMessagesUpdated event');
      fetchUnreadCounts();
    };
    
    window.addEventListener('unreadMessagesUpdated', handleUnreadMessagesUpdated);
    return () => window.removeEventListener('unreadMessagesUpdated', handleUnreadMessagesUpdated);
  }, [fetchUnreadCounts]);
  
  // Listen for new club messages and mark them as unread
  useEffect(() => {
    const handleClubMessage = (event: CustomEvent) => {
      const { clubId, senderId } = event.detail;
      
      if (senderId !== currentUser?.id) {
        console.log('[UnreadMessagesProvider] Club message received, marking as unread:', clubId);
        markClubAsUnread(clubId);
        setRefreshToggle(prev => !prev);
      }
    };
    
    window.addEventListener('clubMessageInserted', handleClubMessage as EventListener);
    return () => window.removeEventListener('clubMessageInserted', handleClubMessage as EventListener);
  }, [currentUser?.id, markClubAsUnread]);
  
  // Debug: Add effect to log the contents of unreadClubs whenever it changes
  useEffect(() => {
    console.log('[UnreadMessagesProvider] unreadClubs updated:', Array.from(unreadClubs));
  }, [unreadClubs]);
  
  // Force re-render method that components can call
  const forceRefresh = useCallback(() => {
    console.log('[UnreadMessagesProvider] Force refresh triggered');
    setRefreshToggle(prev => !prev);
    // Use the new unreadClubs Set to preserve reference integrity
    setUnreadClubs(new Set(unreadClubs));
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
      fetchUnreadCounts
    }}>
      {children}
    </UnreadMessagesContext.Provider>
  );
};
