
import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import UnreadMessagesContext from './UnreadMessagesContext';
import { useApp } from '@/context/app/AppContext';
import { useClubUnreadState } from './hooks/useClubUnreadState';
import { useDirectMessageUnreadState } from './hooks/useDirectMessageUnreadState';
import { useFetchUnreadCounts } from './hooks/useFetchUnreadCounts';
import { useUnreadSubscriptions } from './hooks/useUnreadSubscriptions';
import { isConversationActive } from '@/utils/chat/activeConversationTracker';
import { 
  getLocalReadStatus, 
  isDmReadSince, 
  isClubReadSince 
} from '@/utils/chat/readStatusStorage';
import { debounce } from '@/utils/chat/debounceUtils';

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
  
  // Enhanced markClubAsUnread function that checks active conversations and local read status
  const enhancedMarkClubAsUnread = useCallback((clubId: string, messageTimestamp?: number) => {
    // 1. Check if this club conversation is currently active/open
    if (isConversationActive('club', clubId)) {
      console.log(`[UnreadMessagesProvider] Club ${clubId} is active, not marking as unread`);
      return;
    }
    
    // 2. Check local storage to see if this message has already been read
    if (messageTimestamp && isClubReadSince(clubId, messageTimestamp)) {
      console.log(`[UnreadMessagesProvider] Club ${clubId} was read since message timestamp, not marking as unread`);
      return;
    }
    
    // 3. If not active and not read, mark as unread
    console.log(`[UnreadMessagesProvider] Marking club ${clubId} as unread`);
    markClubAsUnread(clubId);
  }, [markClubAsUnread]);
  
  // Enhanced markConversationAsUnread function that checks active conversations and local read status
  const enhancedMarkConversationAsUnread = useCallback((conversationId: string, messageTimestamp?: number) => {
    // 1. Check if this DM conversation is currently active/open
    if (isConversationActive('dm', conversationId)) {
      console.log(`[UnreadMessagesProvider] DM ${conversationId} is active, not marking as unread`);
      return;
    }
    
    // 2. Check local storage to see if this message has already been read
    if (messageTimestamp && isDmReadSince(conversationId, messageTimestamp)) {
      console.log(`[UnreadMessagesProvider] DM ${conversationId} was read since message timestamp, not marking as unread`);
      return;
    }
    
    // 3. If not active and not read, mark as unread
    console.log(`[UnreadMessagesProvider] Marking DM ${conversationId} as unread`);
    markConversationAsUnread(conversationId);
  }, [markConversationAsUnread]);
  
  // Set up real-time subscriptions for unread messages with enhanced handlers
  useUnreadSubscriptions({
    currentUserId: currentUser?.id,
    isSessionReady,
    markConversationAsUnread: enhancedMarkConversationAsUnread,
    markClubAsUnread: enhancedMarkClubAsUnread,
    fetchUnreadCounts
  });
  
  // Listen for local read status changes
  useEffect(() => {
    const handleLocalReadStatusChange = () => {
      console.log('[UnreadMessagesProvider] Local read status changed, updating UI');
      
      // Re-evaluate unread state based on local storage
      const localReadStatus = getLocalReadStatus();
      
      // Update unread DM conversations
      if (unreadConversations.size > 0) {
        const newUnreadConversations = new Set(unreadConversations);
        unreadConversations.forEach(conversationId => {
          const readTimestamp = localReadStatus.dms[conversationId];
          if (readTimestamp) {
            // This conversation has been locally marked as read
            newUnreadConversations.delete(conversationId);
          }
        });
        
        if (newUnreadConversations.size !== unreadConversations.size) {
          setUnreadConversations(newUnreadConversations);
        }
      }
      
      // Update unread club conversations
      if (unreadClubs.size > 0) {
        const newUnreadClubs = new Set(unreadClubs);
        unreadClubs.forEach(clubId => {
          const readTimestamp = localReadStatus.clubs[clubId];
          if (readTimestamp) {
            // This club has been locally marked as read
            newUnreadClubs.delete(clubId);
          }
        });
        
        if (newUnreadClubs.size !== unreadClubs.size) {
          setUnreadClubs(newUnreadClubs);
        }
      }
    };
    
    window.addEventListener('local-read-status-change', handleLocalReadStatusChange);
    return () => {
      window.removeEventListener('local-read-status-change', handleLocalReadStatusChange);
    };
  }, [unreadConversations, unreadClubs, setUnreadConversations, setUnreadClubs]);
  
  // Update total count whenever individual counts change
  useEffect(() => {
    setTotalUnreadCount(clubUnreadCount + dmUnreadCount);
  }, [clubUnreadCount, dmUnreadCount]);
  
  // Refresh unread counts periodically to stay in sync with the server
  useEffect(() => {
    if (!currentUser?.id || !isSessionReady) return;
    
    // Fetch once on mount
    fetchUnreadCounts();
    
    // Set up periodic refresh (every 5 minutes)
    const intervalId = setInterval(() => {
      fetchUnreadCounts();
    }, 5 * 60 * 1000);
    
    return () => clearInterval(intervalId);
  }, [currentUser?.id, isSessionReady, fetchUnreadCounts]);
  
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
