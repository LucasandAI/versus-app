
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useApp } from './AppContext';

interface UnreadMessagesContextType {
  unreadConversations: Set<string>;
  unreadClubs: Set<string>;
  totalUnreadCount: number;
  markConversationAsRead: (conversationId: string) => Promise<void>;
  markClubMessagesAsRead: (clubId: string) => Promise<void>;
  refreshUnreadState: () => Promise<void>;
}

const UnreadMessagesContext = createContext<UnreadMessagesContextType>({
  unreadConversations: new Set(),
  unreadClubs: new Set(),
  totalUnreadCount: 0,
  markConversationAsRead: async () => {},
  markClubMessagesAsRead: async () => {},
  refreshUnreadState: async () => {}
});

export const useUnreadMessages = () => useContext(UnreadMessagesContext);

export const UnreadMessagesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [unreadConversations, setUnreadConversations] = useState<Set<string>>(new Set());
  const [unreadClubs, setUnreadClubs] = useState<Set<string>>(new Set());
  const [totalUnreadCount, setTotalUnreadCount] = useState(0);
  const { currentUser } = useApp();
  
  const fetchUnreadState = useCallback(async () => {
    if (!currentUser?.id) return;
    
    try {
      // Fetch unread DM conversations
      const { data: directMessages, error: dmError } = await supabase
        .rpc('get_unread_conversations', { user_id: currentUser.id });
        
      if (dmError) {
        throw dmError;
      }
      
      const unreadDMs = new Set<string>();
      if (directMessages && Array.isArray(directMessages)) {
        directMessages.forEach(convo => {
          if (convo && convo.conversation_id) {
            unreadDMs.add(convo.conversation_id);
          }
        });
      }
      
      // Fetch unread club messages
      const { data: clubMessages, error: clubError } = await supabase
        .rpc('get_unread_club_messages', { user_id: currentUser.id });
        
      if (clubError) {
        throw clubError;
      }
      
      const unreadClubIds = new Set<string>();
      if (clubMessages && Array.isArray(clubMessages)) {
        clubMessages.forEach(club => {
          if (club && club.club_id) {
            unreadClubIds.add(club.club_id);
          }
        });
      }
      
      // Update state
      setUnreadConversations(unreadDMs);
      setUnreadClubs(unreadClubIds);
      setTotalUnreadCount(unreadDMs.size + unreadClubIds.size);
      
      console.log(`[UnreadMessagesContext] Refreshed unread state: ${unreadDMs.size} conversations, ${unreadClubIds.size} clubs`);
      
    } catch (error) {
      console.error('[UnreadMessagesContext] Error fetching unread messages:', error);
    }
  }, [currentUser?.id]);
  
  // Initial fetch
  useEffect(() => {
    if (currentUser?.id) {
      fetchUnreadState();
    }
  }, [currentUser?.id, fetchUnreadState]);
  
  // Set up realtime subscription for direct messages
  useEffect(() => {
    if (!currentUser?.id) return;
    
    const channel = supabase
      .channel('unread-messages-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'direct_messages'
      }, () => {
        fetchUnreadState();
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'direct_messages_read'
      }, () => {
        fetchUnreadState();
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'club_chat_messages'
      }, () => {
        fetchUnreadState();
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'club_messages_read'
      }, () => {
        fetchUnreadState();
      })
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUser?.id, fetchUnreadState]);
  
  // Listen for unread messages updated event
  useEffect(() => {
    const handleUnreadMessagesUpdated = () => {
      fetchUnreadState();
    };
    
    window.addEventListener('unreadMessagesUpdated', handleUnreadMessagesUpdated);
    
    return () => {
      window.removeEventListener('unreadMessagesUpdated', handleUnreadMessagesUpdated);
    };
  }, [fetchUnreadState]);
  
  const markConversationAsRead = useCallback(async (conversationId: string) => {
    if (!currentUser?.id) return;
    
    try {
      const now = new Date().toISOString();
      
      // Update or insert a read record
      await supabase
        .from('direct_messages_read')
        .upsert({
          user_id: currentUser.id,
          conversation_id: conversationId,
          last_read_timestamp: now
        });
      
      // Update local state
      setUnreadConversations(prev => {
        const newSet = new Set(prev);
        newSet.delete(conversationId);
        return newSet;
      });
      
      // Update total count
      setTotalUnreadCount(prevCount => {
        const newCount = Math.max(0, prevCount - (unreadConversations.has(conversationId) ? 1 : 0));
        return newCount;
      });
      
      // Dispatch event for other components to update
      window.dispatchEvent(new Event('unreadMessagesUpdated'));
      
    } catch (error) {
      console.error('[UnreadMessagesContext] Error marking conversation as read:', error);
    }
  }, [currentUser?.id, unreadConversations]);
  
  const markClubMessagesAsRead = useCallback(async (clubId: string) => {
    if (!currentUser?.id) return;
    
    try {
      const now = new Date().toISOString();
      
      // Update or insert a read record
      await supabase
        .from('club_messages_read')
        .upsert({
          user_id: currentUser.id,
          club_id: clubId,
          last_read_timestamp: now
        });
        
      // Update local state
      setUnreadClubs(prev => {
        const newSet = new Set(prev);
        newSet.delete(clubId);
        return newSet;
      });
      
      // Update total count
      setTotalUnreadCount(prevCount => {
        const newCount = Math.max(0, prevCount - (unreadClubs.has(clubId) ? 1 : 0));
        return newCount;
      });
      
      // Dispatch event for other components to update
      window.dispatchEvent(new Event('unreadMessagesUpdated'));
      
    } catch (error) {
      console.error('[UnreadMessagesContext] Error marking club messages as read:', error);
    }
  }, [currentUser?.id, unreadClubs]);
  
  // This function can be called by components to refresh the unread state
  const refreshUnreadState = useCallback(async () => {
    await fetchUnreadState();
  }, [fetchUnreadState]);
  
  const contextValue: UnreadMessagesContextType = {
    unreadConversations,
    unreadClubs,
    totalUnreadCount,
    markConversationAsRead,
    markClubMessagesAsRead,
    refreshUnreadState
  };
  
  return (
    <UnreadMessagesContext.Provider value={contextValue}>
      {children}
    </UnreadMessagesContext.Provider>
  );
};

export default UnreadMessagesProvider;
