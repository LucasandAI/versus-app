
import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import UnreadMessagesContext from './UnreadMessagesContext';
import { useApp } from '@/context/app/AppContext';
import { useClubUnreadState } from './hooks/useClubUnreadState';
import { useDirectMessageUnreadState } from './hooks/useDirectMessageUnreadState';
import { useFetchUnreadCounts } from './hooks/useFetchUnreadCounts';
import { useUnreadSubscriptions } from './hooks/useUnreadSubscriptions';

export const UnreadMessagesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, isSessionReady } = useApp();
  const [clubUnreadCounts, setClubUnreadCounts] = useState<Record<string, number>>({});
  const [directMessageUnreadCounts, setDirectMessageUnreadCounts] = useState<Record<string, number>>({});
  const [totalUnreadCount, setTotalUnreadCount] = useState(0);
  
  // Use our dedicated hooks for managing unread state
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
  
  // Hook for fetching unread counts from the database
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
  
  // Set up real-time subscriptions for unread messages
  useUnreadSubscriptions({
    currentUserId: currentUser?.id,
    isSessionReady,
    markConversationAsUnread,
    markClubAsUnread,
    fetchUnreadCounts
  });
  
  // Update total count whenever individual counts change
  useEffect(() => {
    const newTotal = clubUnreadCount + dmUnreadCount;
    setTotalUnreadCount(newTotal);
    console.log('[UnreadMessagesProvider] Total unread count updated:', {
      clubUnreadCount,
      dmUnreadCount, 
      total: newTotal
    });
  }, [clubUnreadCount, dmUnreadCount]);
  
  // Method for refreshing unread counts
  const refreshUnreadCounts = useCallback(async () => {
    console.log('[UnreadMessagesProvider] Refreshing unread counts');
    await fetchUnreadCounts();
  }, [fetchUnreadCounts]);
  
  // Build the context value with all required properties
  const contextValue = {
    totalUnreadCount,
    clubUnreadCounts,
    directMessageUnreadCounts,
    refreshUnreadCounts,
    
    unreadConversations,
    unreadClubs,
    markClubMessagesAsRead,
    markConversationAsRead,
    fetchUnreadCounts,
    
    // Properties from original interface
    unreadClubMessages: unreadClubs, // Map to equivalent properties
    unreadDirectMessageConversations: unreadConversations,
    markDirectConversationAsRead: markConversationAsRead,
    unreadMessagesCount: totalUnreadCount
  };

  return (
    <UnreadMessagesContext.Provider value={contextValue}>
      {children}
    </UnreadMessagesContext.Provider>
  );
};
