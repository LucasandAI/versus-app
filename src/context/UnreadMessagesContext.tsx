
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useApp } from './AppContext';

interface UnreadMessagesContextType {
  unreadClubs: Set<string>;
  unreadConversations: Set<string>;
  totalUnreadCount: number;
  markClubMessagesAsRead: (clubId: string) => Promise<void>;
  markConversationAsRead: (conversationId: string) => Promise<void>;
  resetUnreadCounts: () => void;
}

const UnreadMessagesContext = createContext<UnreadMessagesContextType | undefined>(undefined);

export const UnreadMessagesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [unreadClubs, setUnreadClubs] = useState<Set<string>>(new Set());
  const [unreadConversations, setUnreadConversations] = useState<Set<string>>(new Set());
  const [totalUnreadCount, setTotalUnreadCount] = useState<number>(0);
  const { currentUser } = useApp();

  // Reset unread counts
  const resetUnreadCounts = useCallback(() => {
    setUnreadClubs(new Set());
    setUnreadConversations(new Set());
    setTotalUnreadCount(0);
  }, []);

  // Fetch initial unread message counts
  useEffect(() => {
    if (!currentUser?.id) {
      resetUnreadCounts();
      return;
    }
    
    const fetchUnreadCounts = async () => {
      try {
        // Fetch unread club messages counts
        const { data: unreadClubsData, error: unreadClubsError } = await supabase.rpc(
          'get_unread_club_messages_count',
          { user_id: currentUser.id }
        );
        
        if (unreadClubsError) throw unreadClubsError;
        
        // Fetch unread direct messages counts
        const { data: unreadDMsData, error: unreadDMsError } = await supabase.rpc(
          'get_unread_dm_count',
          { user_id: currentUser.id }
        );
        
        if (unreadDMsError) throw unreadDMsError;
        
        // Get detailed club message data to find which clubs have unread messages
        const { data: unreadClubDetails } = await supabase
          .from('club_chat_messages')
          .select(`
            club_id,
            timestamp
          `)
          .eq('sender_id', currentUser.id)
          .order('timestamp', { ascending: false });
          
        // Build set of club IDs with unread messages
        const clubsWithUnread = new Set<string>();
        if (unreadClubDetails && unreadClubDetails.length > 0) {
          unreadClubDetails.forEach(msg => {
            if (msg.club_id) {
              clubsWithUnread.add(msg.club_id);
            }
          });
        }
        
        // Get detailed DM data to find which conversations have unread messages
        const { data: unreadDMDetails } = await supabase
          .from('direct_messages')
          .select(`
            conversation_id,
            timestamp
          `)
          .eq('receiver_id', currentUser.id)
          .order('timestamp', { ascending: false });
          
        // Build set of conversation IDs with unread messages
        const conversationsWithUnread = new Set<string>();
        if (unreadDMDetails && unreadDMDetails.length > 0) {
          unreadDMDetails.forEach(msg => {
            if (msg.conversation_id) {
              conversationsWithUnread.add(msg.conversation_id);
            }
          });
        }
        
        // Update state with the new data
        setUnreadClubs(clubsWithUnread);
        setUnreadConversations(conversationsWithUnread);
        setTotalUnreadCount((unreadClubsData || 0) + (unreadDMsData || 0));
      } catch (error) {
        console.error('[UnreadMessagesContext] Error fetching unread counts:', error);
      }
    };
    
    fetchUnreadCounts();
  }, [currentUser?.id, resetUnreadCounts]);

  // Mark club messages as read
  const markClubMessagesAsRead = useCallback(async (clubId: string) => {
    if (!currentUser?.id || !clubId) return;
    
    try {
      const now = new Date().toISOString();
      
      // Check if we already have a read record for this club
      const { data: existingRead } = await supabase
        .from('club_messages_read')
        .select('id')
        .eq('club_id', clubId)
        .eq('user_id', currentUser.id)
        .single();
        
      if (existingRead) {
        // Update existing record
        await supabase
          .from('club_messages_read')
          .update({ last_read_timestamp: now })
          .eq('id', existingRead.id);
      } else {
        // Create new record
        await supabase
          .from('club_messages_read')
          .insert({
            club_id: clubId,
            user_id: currentUser.id,
            last_read_timestamp: now
          });
      }
      
      // Remove this club from the unread set
      setUnreadClubs(prev => {
        const updated = new Set(prev);
        updated.delete(clubId);
        return updated;
      });
      
      // Update total count
      setTotalUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('[UnreadMessagesContext] Error marking club messages as read:', error);
    }
  }, [currentUser?.id]);

  // Mark conversation messages as read
  const markConversationAsRead = useCallback(async (conversationId: string) => {
    if (!currentUser?.id || !conversationId || conversationId === 'new') return;
    
    try {
      const now = new Date().toISOString();
      
      // Check if we already have a read record for this conversation
      const { data: existingRead } = await supabase
        .from('direct_messages_read')
        .select('id')
        .eq('conversation_id', conversationId)
        .eq('user_id', currentUser.id)
        .single();
        
      if (existingRead) {
        // Update existing record
        await supabase
          .from('direct_messages_read')
          .update({ last_read_timestamp: now })
          .eq('id', existingRead.id);
      } else {
        // Create new record
        await supabase
          .from('direct_messages_read')
          .insert({
            conversation_id: conversationId,
            user_id: currentUser.id,
            last_read_timestamp: now
          });
      }
      
      // Remove this conversation from the unread set
      setUnreadConversations(prev => {
        const updated = new Set(prev);
        updated.delete(conversationId);
        return updated;
      });
      
      // Update total count
      setTotalUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('[UnreadMessagesContext] Error marking conversation as read:', error);
    }
  }, [currentUser?.id]);

  // Listen for events
  useEffect(() => {
    const handleUnreadMessage = (event: CustomEvent<{clubId?: string, conversationId?: string}>) => {
      const { clubId, conversationId } = event.detail;
      
      if (clubId) {
        setUnreadClubs(prev => {
          const updated = new Set(prev);
          updated.add(clubId);
          return updated;
        });
        setTotalUnreadCount(prev => prev + 1);
      } else if (conversationId) {
        setUnreadConversations(prev => {
          const updated = new Set(prev);
          updated.add(conversationId);
          return updated;
        });
        setTotalUnreadCount(prev => prev + 1);
      }
    };
    
    window.addEventListener('unreadMessagesUpdated', handleUnreadMessage as EventListener);
    
    return () => {
      window.removeEventListener('unreadMessagesUpdated', handleUnreadMessage as EventListener);
    };
  }, []);

  const value = {
    unreadClubs,
    unreadConversations,
    totalUnreadCount,
    markClubMessagesAsRead,
    markConversationAsRead,
    resetUnreadCounts
  };

  return (
    <UnreadMessagesContext.Provider value={value}>
      {children}
    </UnreadMessagesContext.Provider>
  );
};

export const useUnreadMessages = () => {
  const context = useContext(UnreadMessagesContext);
  if (context === undefined) {
    throw new Error('useUnreadMessages must be used within a UnreadMessagesProvider');
  }
  return context;
};
