
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
      
      // Fetch DM unread counts using the RPC function
      const { data: dmCount, error: dmError } = await supabase.rpc('get_unread_dm_count', {
        user_id: currentUser.id
      });
      
      if (dmError) throw dmError;
      setDmUnreadCount(dmCount || 0);

      // Fetch club unread counts using the RPC function
      const { data: clubCount, error: clubError } = await supabase.rpc('get_unread_club_messages_count', {
        user_id: currentUser.id
      });
      
      if (clubError) throw clubError;
      setClubUnreadCount(clubCount || 0);

      // Get unread conversations by fetching direct messages and read status
      const { data: directMessages } = await supabase
        .from('direct_messages')
        .select(`
          conversation_id,
          receiver_id,
          timestamp
        `)
        .eq('receiver_id', currentUser.id);
        
      const { data: readStatus } = await supabase
        .from('direct_messages_read')
        .select('conversation_id, last_read_timestamp')
        .eq('user_id', currentUser.id);
        
      // Build a map of conversation_id -> last_read_timestamp
      const readMap: Record<string, string> = {};
      readStatus?.forEach(status => {
        readMap[status.conversation_id] = status.last_read_timestamp;
      });
      
      // Identify unread conversations by comparing message timestamp with read timestamp
      const unreadConvs = new Set<string>();
      directMessages?.forEach(msg => {
        const lastRead = readMap[msg.conversation_id];
        if (!lastRead || new Date(msg.timestamp) > new Date(lastRead)) {
          unreadConvs.add(msg.conversation_id);
        }
      });
      
      setUnreadConversations(unreadConvs);
      
      // Similarly for club messages
      const { data: clubMembers } = await supabase
        .from('club_members')
        .select('club_id')
        .eq('user_id', currentUser.id);
        
      if (!clubMembers?.length) {
        setUnreadClubs(new Set());
        return;
      }
      
      const clubIds = clubMembers.map(member => member.club_id);
      
      console.log('[UnreadMessagesContext] User club IDs:', clubIds);
      
      // Get club messages
      const { data: clubMessages, error: clubMessagesError } = await supabase
        .from('club_chat_messages')
        .select('club_id, sender_id, timestamp')
        .in('club_id', clubIds)
        .neq('sender_id', currentUser.id);
        
      if (clubMessagesError) {
        console.error('[UnreadMessagesContext] Error fetching club messages:', clubMessagesError);
      }
      
      console.log('[UnreadMessagesContext] Club messages found:', clubMessages?.length || 0);
      
      // Get club read status
      const { data: clubReadStatus, error: clubReadError } = await supabase
        .from('club_messages_read')
        .select('club_id, last_read_timestamp')
        .eq('user_id', currentUser.id)
        .in('club_id', clubIds);
        
      if (clubReadError) {
        console.error('[UnreadMessagesContext] Error fetching club read status:', clubReadError);
      }
      
      // Build a map of club_id -> last_read_timestamp
      const clubReadMap: Record<string, string> = {};
      clubReadStatus?.forEach(status => {
        clubReadMap[status.club_id] = status.last_read_timestamp;
      });
      
      console.log('[UnreadMessagesContext] Club read statuses:', clubReadMap);
      
      // Identify unread club chats
      const unreadClubsSet = new Set<string>();
      clubMessages?.forEach(msg => {
        const lastRead = clubReadMap[msg.club_id];
        if (!lastRead || new Date(msg.timestamp) > new Date(lastRead)) {
          unreadClubsSet.add(msg.club_id);
          console.log(`[UnreadMessagesContext] Club ${msg.club_id} has unread messages. Last message: ${msg.timestamp}, Last read: ${lastRead || 'never'}`);
        }
      });
      
      console.log('[UnreadMessagesContext] Unread clubs set:', Array.from(unreadClubsSet));
      setUnreadClubs(unreadClubsSet);
      
      console.log('[UnreadMessagesContext] Unread counts fetched:', { 
        dmCount, 
        clubCount,
        unreadConversations: unreadConvs.size,
        unreadClubs: unreadClubsSet.size
      });
      
      // Dispatch event to notify UI components of changes
      window.dispatchEvent(new CustomEvent('unreadMessagesUpdated'));
      
    } catch (error) {
      console.error('[UnreadMessagesContext] Error fetching unread counts:', error);
    }
  }, [currentUser?.id, isSessionReady]);

  // Fetch initial unread status for DMs
  useEffect(() => {
    if (!isSessionReady || !currentUser?.id) return;
    
    console.log('[UnreadMessagesContext] Setting up realtime subscriptions for user:', currentUser.id);
    
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
            console.log('[UnreadMessagesContext] New DM received:', payload);
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
            console.log('[UnreadMessagesContext] New club message received:', payload);
            if (payload.new.sender_id !== currentUser.id) {
              console.log(`[UnreadMessagesContext] Marking club ${payload.new.club_id} as unread`);
              markClubAsUnread(payload.new.club_id);
            }
          })
      .subscribe();
      
    // Initial fetch of unread counts
    fetchUnreadCounts();
      
    return () => {
      supabase.removeChannel(dmChannel);
      supabase.removeChannel(clubChannel);
    };
  }, [currentUser?.id, isSessionReady, fetchUnreadCounts]);

  // Mark club as unread (for new incoming messages)
  const markClubAsUnread = useCallback((clubId: string) => {
    console.log(`[UnreadMessagesContext] Marking club ${clubId} as unread`);
    
    setUnreadClubs(prev => {
      const updated = new Set(prev);
      const normalizedClubId = clubId.toString(); // Convert to string to ensure consistency
      
      if (!updated.has(normalizedClubId)) {
        updated.add(normalizedClubId);
        console.log(`[UnreadMessagesContext] Club ${normalizedClubId} added to unread set:`, Array.from(updated));
        setClubUnreadCount(prev => prev + 1);
        
        // Dispatch event to notify UI components
        window.dispatchEvent(new CustomEvent('unreadMessagesUpdated'));
      } else {
        console.log(`[UnreadMessagesContext] Club ${normalizedClubId} was already in unread set`);
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
        
        // Dispatch event to notify UI components
        window.dispatchEvent(new CustomEvent('unreadMessagesUpdated'));
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
      
      // Dispatch event to notify UI components
      window.dispatchEvent(new CustomEvent('unreadMessagesUpdated'));
      
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
      
      // Notify UI components about the revert
      window.dispatchEvent(new CustomEvent('unreadMessagesUpdated'));
      
      toast.error("Failed to mark conversation as read");
    }
  }, [currentUser?.id]);

  // Mark club messages as read
  const markClubMessagesAsRead = useCallback(async (clubId: string) => {
    if (!currentUser?.id || !clubId) return;
    
    console.log(`[UnreadMessagesContext] Marking club ${clubId} messages as read`);
    
    // Optimistically update local state
    setUnreadClubs(prev => {
      if (!prev.has(clubId)) {
        console.log(`[UnreadMessagesContext] Club ${clubId} not in unread set:`, Array.from(prev));
        return prev;
      }
      
      const updated = new Set(prev);
      updated.delete(clubId);
      console.log(`[UnreadMessagesContext] Club ${clubId} removed from unread set:`, Array.from(updated));
      setClubUnreadCount(prevCount => Math.max(0, prevCount - 1));
      
      // Dispatch event to notify UI components
      window.dispatchEvent(new CustomEvent('unreadMessagesUpdated'));
      
      return updated;
    });
    
    try {
      // Update the read timestamp in the database
      const normalizedClubId = clubId.toString(); // Ensure it's a string
      console.log(`[UnreadMessagesContext] Updating read timestamp for club ${normalizedClubId} in database`);
      
      const { error } = await supabase
        .from('club_messages_read')
        .upsert({
          user_id: currentUser.id,
          club_id: normalizedClubId,
          last_read_timestamp: new Date().toISOString()
        }, {
          onConflict: 'user_id,club_id'
        });
      
      if (error) {
        console.error(`[UnreadMessagesContext] Error updating club_messages_read:`, error);
        throw error;
      }
      
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
      
      // Notify UI components about the revert
      window.dispatchEvent(new CustomEvent('unreadMessagesUpdated'));
      
      toast.error("Failed to mark club messages as read");
    }
  }, [currentUser?.id]);

  // Debug: Add effect to log the contents of unreadClubs whenever it changes
  useEffect(() => {
    console.log('[UnreadMessagesContext] unreadClubs updated:', Array.from(unreadClubs));
  }, [unreadClubs]);

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
