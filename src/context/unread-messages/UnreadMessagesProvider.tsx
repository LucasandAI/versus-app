
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
    
    // Dispatch event when unread state changes to notify components
    window.dispatchEvent(new CustomEvent('unreadMessagesUpdated'));
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
    };
    
    // Listen for DM events
    const dmHandler = (e: CustomEvent) => {
      if (e.detail?.conversationId) {
        console.log('[UnreadMessagesProvider] DM received for conversation:', e.detail.conversationId);
        if (currentUser && e.detail.message && e.detail.message.sender.id !== currentUser.id) {
          markConversationAsUnread(e.detail.conversationId);
        }
      }
    };
    
    window.addEventListener('unreadMessagesUpdated', handler);
    window.addEventListener('dmMessageReceived', dmHandler as EventListener);
    
    return () => {
      window.removeEventListener('unreadMessagesUpdated', handler);
      window.removeEventListener('dmMessageReceived', dmHandler as EventListener);
    };
  }, [currentUser, markConversationAsUnread]);
  
  // Force re-render method that components can call - memoized
  const forceRefresh = useCallback(() => {
    console.log('[UnreadMessagesProvider] Force refresh triggered');
    // Use state from ref to avoid closure issues
    setUnreadClubs(new Set(stateRef.current.unreadClubs));
    setUnreadConversations(new Set(stateRef.current.unreadConversations));
    window.dispatchEvent(new CustomEvent('unreadMessagesUpdated'));
  }, [setUnreadClubs, setUnreadConversations]);
  
  // Memoize context value to prevent unnecessary re-renders of consumers
  const contextValue = useMemo(() => ({
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
  }), [
    unreadConversations, dmUnreadCount, unreadMessagesPerConversation,
    unreadClubs, clubUnreadCount, unreadMessagesPerClub, totalUnreadCount,
    markConversationAsRead, markClubMessagesAsRead, markConversationAsUnread, markClubAsUnread,
    fetchUnreadCounts, forceRefresh
  ]);
  
  return (
    <UnreadMessagesContext.Provider value={contextValue}>
      {children}
    </UnreadMessagesContext.Provider>
  );
};
