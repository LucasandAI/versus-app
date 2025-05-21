
import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useUnreadMessages } from '@/context/unread-messages';

export const useMessageReadStatus = () => {
  const { markDirectConversationAsRead, markClubMessagesAsRead } = useUnreadMessages();

  const markDirectMessagesAsRead = useCallback(async (conversationId: string, userId: string, delay = 0) => {
    if (delay > 0) {
      // Add delay before marking as read to prevent badge flickering
      await new Promise(resolve => setTimeout(resolve, delay));
    }
    
    try {
      // Use the context method for optimistic updates
      await markDirectConversationAsRead(conversationId);
    } catch (error) {
      console.error('[useMessageReadStatus] Error marking DM as read:', error);
    }
  }, [markDirectConversationAsRead]);

  const markClubMessagesAsReadLegacy = useCallback(async (clubId: string, userId: string, delay = 0) => {
    if (delay > 0) {
      // Add delay before marking as read to prevent badge flickering
      await new Promise(resolve => setTimeout(resolve, delay));
    }

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
