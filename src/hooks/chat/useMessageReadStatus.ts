
import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useUnreadMessages } from '@/context/UnreadMessagesContext';

export const useMessageReadStatus = () => {
  const { markConversationAsRead, markClubMessagesAsRead } = useUnreadMessages();

  const markDirectMessagesAsRead = useCallback(async (conversationId: string, userId: string) => {
    try {
      // Use the context method for optimistic updates
      await markConversationAsRead(conversationId);
    } catch (error) {
      console.error('[useMessageReadStatus] Error marking DM as read:', error);
    }
  }, [markConversationAsRead]);

  const markClubMessagesAsReadLegacy = useCallback(async (clubId: string, userId: string) => {
    try {
      // Use the context method for optimistic updates
      await markClubMessagesAsRead(clubId);
    } catch (error) {
      console.error('[useMessageReadStatus] Error marking club messages as read:', error);
    }
  }, [markClubMessagesAsRead]);

  return {
    markDirectMessagesAsRead,
    markClubMessagesAsRead: markClubMessagesAsReadLegacy
  };
};
