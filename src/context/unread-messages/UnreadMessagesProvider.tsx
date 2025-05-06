
import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import UnreadMessagesContext from './UnreadMessagesContext';
import { useApp } from '@/context/app/AppContext';

export const UnreadMessagesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useApp();
  const [clubUnreadCounts, setClubUnreadCounts] = useState<Record<string, number>>({});
  const [directMessageUnreadCounts, setDirectMessageUnreadCounts] = useState<Record<string, number>>({});
  const [totalUnreadCount, setTotalUnreadCount] = useState(0);

  // Function to fetch unread counts from the database
  const fetchUnreadCounts = useCallback(async () => {
    if (!currentUser) return;
    
    try {
      // Get club unread message counts
      const { data: clubData, error: clubError } = await supabase
        .rpc('get_unread_club_messages_count', { user_id: currentUser.id });
        
      if (clubError) {
        console.error('Error fetching club unread counts:', clubError);
      }
      
      // Get direct message unread counts
      const { data: dmData, error: dmError } = await supabase
        .rpc('get_unread_dm_count', { user_id: currentUser.id });
        
      if (dmError) {
        console.error('Error fetching DM unread counts:', dmError);
      }
      
      // Update states
      const clubCount = clubData || 0;
      const dmCount = dmData || 0;
      setTotalUnreadCount(clubCount + dmCount);
      
    } catch (error) {
      console.error('Error in fetchUnreadCounts:', error);
    }
  }, [currentUser]);

  // Set up subscriptions and fetch initial counts
  useEffect(() => {
    if (!currentUser) return;
    
    fetchUnreadCounts();
    
    // Subscribe to club chat messages
    const clubChatChannel = supabase
      .channel('club-chat-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'club_chat_messages'
        },
        () => {
          fetchUnreadCounts();
        }
      )
      .subscribe();
      
    // Subscribe to direct messages
    const directMessageChannel = supabase
      .channel('direct-message-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'direct_messages'
        },
        () => {
          fetchUnreadCounts();
        }
      )
      .subscribe();
      
    // Subscribe to read status changes
    const readStatusChannel = supabase
      .channel('read-status-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'club_messages_read'
        },
        () => {
          fetchUnreadCounts();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'direct_messages_read'
        },
        () => {
          fetchUnreadCounts();
        }
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(clubChatChannel);
      supabase.removeChannel(directMessageChannel);
      supabase.removeChannel(readStatusChannel);
    };
  }, [currentUser, fetchUnreadCounts]);

  const contextValue = {
    totalUnreadCount,
    clubUnreadCounts,
    directMessageUnreadCounts,
    refreshUnreadCounts: fetchUnreadCounts
  };

  return (
    <UnreadMessagesContext.Provider value={contextValue}>
      {children}
    </UnreadMessagesContext.Provider>
  );
};
