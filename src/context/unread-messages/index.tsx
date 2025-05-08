
import React, { createContext, useContext, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface UnreadMessagesContextType {
  unreadClubs: Set<string>;
  unreadConversations: Set<string>;
  clubMessagesCount: Record<string, number>;
  dmMessagesCount: Record<string, number>;
  markClubAsRead: (clubId: string) => void;
  markConversationAsRead: (conversationId: string) => void;
  markClubMessagesAsRead: (clubId: string) => void;
  markDirectMessagesAsRead: (conversationId: string) => void;
  refreshUnreadCounts: () => Promise<void>;
}

const UnreadMessagesContext = createContext<UnreadMessagesContextType | undefined>(undefined);

export const UnreadMessagesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [unreadClubs, setUnreadClubs] = useState<Set<string>>(new Set());
  const [unreadConversations, setUnreadConversations] = useState<Set<string>>(new Set());
  const [clubMessagesCount, setClubMessagesCount] = useState<Record<string, number>>({});
  const [dmMessagesCount, setDmMessagesCount] = useState<Record<string, number>>({});
  
  const markClubAsRead = useCallback((clubId: string) => {
    setUnreadClubs(prev => {
      const next = new Set(prev);
      next.delete(clubId);
      return next;
    });
  }, []);

  const markConversationAsRead = useCallback((conversationId: string) => {
    setUnreadConversations(prev => {
      const next = new Set(prev);
      next.delete(conversationId);
      return next;
    });
  }, []);

  const markClubMessagesAsRead = useCallback(async (clubId: string) => {
    try {
      const { error } = await supabase.from('club_messages_read').upsert({
        club_id: clubId,
        user_id: (await supabase.auth.getUser()).data.user?.id,
        last_read_timestamp: new Date().toISOString()
      });

      if (error) console.error('Error marking club messages as read:', error);
      
      markClubAsRead(clubId);
    } catch (e) {
      console.error('Error in markClubMessagesAsRead:', e);
    }
  }, [markClubAsRead]);

  const markDirectMessagesAsRead = useCallback(async (conversationId: string) => {
    try {
      const { error } = await supabase.from('direct_messages_read').upsert({
        conversation_id: conversationId,
        user_id: (await supabase.auth.getUser()).data.user?.id,
        last_read_timestamp: new Date().toISOString()
      });

      if (error) console.error('Error marking direct messages as read:', error);
      
      markConversationAsRead(conversationId);
    } catch (e) {
      console.error('Error in markDirectMessagesAsRead:', e);
    }
  }, [markConversationAsRead]);

  const refreshUnreadCounts = useCallback(async () => {
    // In a real implementation, this would fetch unread counts from the server
    // For now, we'll just use the existing state
    console.log('Refreshing unread counts');
  }, []);

  return (
    <UnreadMessagesContext.Provider value={{
      unreadClubs,
      unreadConversations,
      clubMessagesCount,
      dmMessagesCount,
      markClubAsRead,
      markConversationAsRead,
      markClubMessagesAsRead,
      markDirectMessagesAsRead,
      refreshUnreadCounts
    }}>
      {children}
    </UnreadMessagesContext.Provider>
  );
};

export const useUnreadMessages = () => {
  const context = useContext(UnreadMessagesContext);
  if (!context) {
    throw new Error('useUnreadMessages must be used within a UnreadMessagesProvider');
  }
  return context;
};

export default UnreadMessagesContext;
