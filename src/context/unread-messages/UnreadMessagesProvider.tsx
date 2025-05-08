
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
    setTotalUnreadCount(clubUnreadCount + dmUnreadCount);
    
    // Update club-specific counts for legacy components
    if (unreadMessagesPerClub) {
      const clubCounts: Record<string, number> = {};
      Object.entries(unreadMessagesPerClub).forEach(([clubId, messages]) => {
        clubCounts[clubId] = messages.length;
      });
      setClubUnreadCounts(clubCounts);
    }
    
    // Update conversation-specific counts for legacy components
    if (unreadMessagesPerConversation) {
      const dmCounts: Record<string, number> = {};
      Object.entries(unreadMessagesPerConversation).forEach(([conversationId, messages]) => {
        dmCounts[conversationId] = messages.length;
      });
      setDirectMessageUnreadCounts(dmCounts);
    }
  }, [clubUnreadCount, dmUnreadCount, unreadMessagesPerClub, unreadMessagesPerConversation]);
  
  // Legacy method for compatibility
  const refreshUnreadCounts = useCallback(async () => {
    await fetchUnreadCounts();
  }, [fetchUnreadCounts]);
  
  // Build the context value with all required properties
  const contextValue = {
    totalUnreadCount,
    clubUnreadCounts,
    directMessageUnreadCounts,
    refreshUnreadCounts,
    
    // Add the missing properties
    unreadConversations,
    unreadClubs,
    markClubMessagesAsRead,
    markConversationAsRead,
    fetchUnreadCounts
  };

  return (
    <UnreadMessagesContext.Provider value={contextValue}>
      {children}
    </UnreadMessagesContext.Provider>
  );
};
