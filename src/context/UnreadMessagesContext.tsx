
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useApp } from '@/context/AppContext';
import { toast } from "sonner";

interface UnreadMessagesContextType {
  // DM Notifications
  unreadConversations: Set<string>;
  dmUnreadCount: number;
  
  // Club Notifications
  unreadClubs: Set<string>;
  clubUnreadCount: number;
  
  // Combined total
  totalUnreadCount: number;
  
  // Mark as read functions
  markConversationAsRead: (conversationId: string) => Promise<void>;
  markClubMessagesAsRead: (clubId: string) => Promise<void>;
  
  // Mark as unread functions (for incoming messages)
  markConversationAsUnread: (conversationId: string) => void;
  markClubAsUnread: (clubId: string) => void;
  
  // Fetch unread counts from server
  fetchUnreadCounts: () => Promise<void>;
}

const UnreadMessagesContext = createContext<UnreadMessagesContextType>({
  unreadConversations: new Set(),
  dmUnreadCount: 0,
  unreadClubs: new Set(),
  clubUnreadCount: 0,
  totalUnreadCount: 0,
  markConversationAsRead: async () => {},
  markClubMessagesAsRead: async () => {},
  markConversationAsUnread: () => {},
  markClubAsUnread: () => {},
  fetchUnreadCounts: async () => {},
});

export const useUnreadMessages = () => useContext(UnreadMessagesContext);

export const UnreadMessagesProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  // State for unread tracking
  const [unreadConversations, setUnreadConversations] = useState<Set<string>>(new Set());
  const [unreadClubs, setUnreadClubs] = useState<Set<string>>(new Set());
  const [dmUnreadCount, setDmUnreadCount] = useState(0);
  const [clubUnreadCount, setClubUnreadCount] = useState(0);
  
  // Combined total
  const totalUnreadCount = dmUnreadCount + clubUnreadCount;
  
  const { currentUser, isSessionReady } = useApp();
  
  // Fetch unread counts from the server
  const fetchUnreadCounts = useCallback(async () => {
    if (!isSessionReady || !currentUser?.id) return;
    
    try {
      console.log('[UnreadMessagesContext] Fetching unread counts');
      
      // Fetch DM unread counts
      const { data: dmCount, error: dmError } = await supabase.rpc('get_unread_dm_count', {
        user_id: currentUser.id
      });
      
      if (dmError) throw dmError;
      setDmUnreadCount(dmCount || 0);

      // Fetch club unread counts
      const { data: clubCount, error: clubError } = await supabase.rpc('get_unread_club_messages_count', {
        user_id: currentUser.id
      });
      
      if (clubError) throw clubError;
      setClubUnreadCount(clubCount || 0);

      // Get unread conversations
      const { data: unreadDMs, error: unreadDMsError } = await supabase
        .from('direct_messages_read')
        .select('conversation_id')
        .eq('user_id', currentUser.id)
        .filter('has_unread', 'eq', true);

      if (unreadDMsError) throw unreadDMsError;
      
      if (unreadDMs) {
        setUnreadConversations(new Set(unreadDMs.map(dm => dm.conversation_id)));
      }

      // Get unread clubs
      const { data: unreadClubsData, error: unreadClubsError } = await supabase
        .from('club_messages_read')
        .select('club_id')
        .eq('user_id', currentUser.id)
        .filter('has_unread', 'eq', true);

      if (unreadClubsError) throw unreadClubsError;
      
      if (unreadClubsData) {
        setUnreadClubs(new Set(unreadClubsData.map(club => club.club_id)));
      }
      
      console.log('[UnreadMessagesContext] Unread counts fetched:', { dmCount, clubCount });
      
    } catch (error) {
      console.error('[UnreadMessagesContext] Error fetching unread counts:', error);
    }
  }, [currentUser?.id, isSessionReady]);

  // Fetch initial unread status for DMs
  useEffect(() => {
    if (!isSessionReady || !currentUser?.id) return;
    
    // Initial fetch happens through useInitialAppLoad now
    
    // Set up real-time subscriptions for new messages
    const dmChannel = supabase
      .channel('global-dm-unread-tracking')
      .on('postgres_changes', 
          { 
            event: 'INSERT', 
            schema: 'public', 
            table: 'direct_messages' 
          },
          (payload) => {
            if (payload.new.receiver_id === currentUser.id) {
              markConversationAsUnread(payload.new.conversation_id);
            }
          })
      .subscribe();
    
    // Subscribe to new club messages
    const clubChannel = supabase.channel('global-club-unread-tracking')
      .on('postgres_changes', 
          { 
            event: 'INSERT', 
            schema: 'public', 
            table: 'club_chat_messages'
          },
          (payload) => {
            if (payload.new.sender_id !== currentUser.id) {
              markClubAsUnread(payload.new.club_id);
            }
          })
      .subscribe();
      
    return () => {
      supabase.removeChannel(dmChannel);
      supabase.removeChannel(clubChannel);
    };
  }, [currentUser?.id, isSessionReady]);

  // Mark club as unread (for new incoming messages)
  const markClubAsUnread = useCallback((clubId: string) => {
    setUnreadClubs(prev => {
      const updated = new Set(prev);
      if (!updated.has(clubId)) {
        updated.add(clubId);
        setClubUnreadCount(prev => prev + 1);
      }
      return updated;
    });
  }, []);

  // Mark conversation as unread (for new incoming messages)
  const markConversationAsUnread = useCallback((conversationId: string) => {
    setUnreadConversations(prev => {
      const updated = new Set(prev);
      if (!updated.has(conversationId)) {
        updated.add(conversationId);
        setDmUnreadCount(prev => prev + 1);
      }
      return updated;
    });
  }, []);

  // Mark conversation as read
  const markConversationAsRead = useCallback(async (conversationId: string) => {
    if (!currentUser?.id || !conversationId) return;
    
    // Optimistically update local state
    setUnreadConversations(prev => {
      if (!prev.has(conversationId)) return prev;
      
      const updated = new Set(prev);
      updated.delete(conversationId);
      setDmUnreadCount(prevCount => Math.max(0, prevCount - 1));
      return updated;
    });
    
    try {
      // Update the read timestamp in the database
      const { error } = await supabase
        .from('direct_messages_read')
        .upsert({
          user_id: currentUser.id,
          conversation_id: conversationId,
          last_read_timestamp: new Date().toISOString()
        }, {
          onConflict: 'user_id,conversation_id'
        });
      
      if (error) throw error;
      
    } catch (error) {
      console.error('[UnreadMessagesContext] Error marking conversation as read:', error);
      
      // Revert optimistic update on error
      setUnreadConversations(prev => {
        const reverted = new Set(prev);
        reverted.add(conversationId);
        return reverted;
      });
      setDmUnreadCount(prev => prev + 1);
      
      toast.error("Failed to mark conversation as read");
    }
  }, [currentUser?.id]);

  // Mark club messages as read
  const markClubMessagesAsRead = useCallback(async (clubId: string) => {
    if (!currentUser?.id || !clubId) return;
    
    console.log('[UnreadMessagesContext] Marking club messages as read:', clubId);
    
    // Optimistically update local state
    setUnreadClubs(prev => {
      if (!prev.has(clubId)) return prev;
      
      const updated = new Set(prev);
      updated.delete(clubId);
      setClubUnreadCount(prevCount => Math.max(0, prevCount - 1));
      return updated;
    });
    
    try {
      // Update the read timestamp in the database
      const { error } = await supabase
        .from('club_messages_read')
        .upsert({
          user_id: currentUser.id,
          club_id: clubId,
          last_read_timestamp: new Date().toISOString()
        }, {
          onConflict: 'user_id,club_id'
        });
      
      if (error) throw error;
      
      // Dispatch event to notify other components
      window.dispatchEvent(new CustomEvent('clubMessagesRead', { 
        detail: { clubId } 
      }));
      
    } catch (error) {
      console.error('[UnreadMessagesContext] Error marking club messages as read:', error);
      
      // Revert optimistic update on error
      setUnreadClubs(prev => {
        const reverted = new Set(prev);
        reverted.add(clubId);
        return reverted;
      });
      setClubUnreadCount(prev => prev + 1);
      
      toast.error("Failed to mark club messages as read");
    }
  }, [currentUser?.id]);

  return (
    <UnreadMessagesContext.Provider value={{
      unreadConversations,
      dmUnreadCount,
      unreadClubs,
      clubUnreadCount,
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
