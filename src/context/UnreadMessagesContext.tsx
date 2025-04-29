
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

  // Fetch initial unread status for DMs
  useEffect(() => {
    if (!isSessionReady || !currentUser?.id) return;
    
    const fetchUnreadStatus = async () => {
      try {
        // First get all conversations
        const { data: conversations } = await supabase
          .from('direct_conversations')
          .select('id')
          .or(`user1_id.eq.${currentUser.id},user2_id.eq.${currentUser.id}`);
          
        if (!conversations?.length) return;
        
        const conversationIds = conversations.map(c => c.id);
        
        // Then fetch latest message for each conversation
        const { data: latestMessages } = await supabase
          .from('direct_messages')
          .select('conversation_id, sender_id, timestamp')
          .in('conversation_id', conversationIds)
          .order('timestamp', { ascending: false })
          .limit(conversationIds.length);
          
        if (!latestMessages?.length) return;
        
        // Group by conversation to get latest message per conversation
        const latestMessageByConversation: Record<string, {sender_id: string, timestamp: string}> = {};
        latestMessages.forEach(message => {
          if (!latestMessageByConversation[message.conversation_id] ||
              new Date(message.timestamp) > new Date(latestMessageByConversation[message.conversation_id].timestamp)) {
            latestMessageByConversation[message.conversation_id] = {
              sender_id: message.sender_id,
              timestamp: message.timestamp
            };
          }
        });
        
        // Get read timestamps
        const { data: readTimestamps } = await supabase
          .from('direct_messages_read')
          .select('conversation_id, last_read_timestamp')
          .eq('user_id', currentUser.id)
          .in('conversation_id', conversationIds);
          
        const readTimestampByConversation: Record<string, string> = {};
        if (readTimestamps) {
          readTimestamps.forEach(rt => {
            readTimestampByConversation[rt.conversation_id] = rt.last_read_timestamp;
          });
        }
        
        // Calculate unread status
        const unreadConvs = new Set<string>();
        let unreadCount = 0;
        
        Object.entries(latestMessageByConversation).forEach(([conversationId, message]) => {
          // If message is from someone else and either no read timestamp or read timestamp is older
          if (message.sender_id !== currentUser.id && 
              (!readTimestampByConversation[conversationId] || 
               new Date(message.timestamp) > new Date(readTimestampByConversation[conversationId]))) {
            unreadConvs.add(conversationId);
            unreadCount++;
          }
        });
        
        setUnreadConversations(unreadConvs);
        setDmUnreadCount(unreadCount);
      } catch (error) {
        console.error('[UnreadMessagesContext] Error fetching unread DM status:', error);
      }
    };
    
    // Fetch unread club messages
    const fetchUnreadClubs = async () => {
      try {
        // Get unread club messages count
        const { data: unreadCount } = await supabase.rpc('get_unread_club_messages_count', {
          user_id: currentUser.id
        });
        
        // Get club IDs with unread messages
        const { data: unreadClubsData } = await supabase
          .from('club_messages_read')
          .select('club_id')
          .eq('user_id', currentUser.id)
          .filter('has_unread', 'eq', true);

        if (unreadClubsData) {
          setUnreadClubs(new Set(unreadClubsData?.map(club => club.club_id)));
        }
        
        setClubUnreadCount(unreadCount || 0);
      } catch (error) {
        console.error('[UnreadMessagesContext] Error fetching unread club status:', error);
      }
    };
    
    fetchUnreadStatus();
    fetchUnreadClubs();
    
  }, [currentUser?.id, isSessionReady]);

  // Set up real-time subscriptions for new messages
  useEffect(() => {
    if (!isSessionReady || !currentUser?.id) return;
    
    // Subscribe to new DMs
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
      markClubAsUnread
    }}>
      {children}
    </UnreadMessagesContext.Provider>
  );
};
