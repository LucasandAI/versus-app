
import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useUnreadMessages } from '@/context/unread-messages';

export const useMessageReadStatus = () => {
  const { markDirectConversationAsRead, markClubMessagesAsRead } = useUnreadMessages();

  const markDirectMessagesAsRead = useCallback(async (conversationId: string, userId: string, delay = 0) => {
    // Set the conversation as active to prevent new messages from being marked as unread
    window.dispatchEvent(new CustomEvent('conversationActive', { 
      detail: { conversationId } 
    }));

    try {
      // Immediately dispatch an event to update badge counts (optimistic update)
      window.dispatchEvent(new CustomEvent('unreadMessagesUpdated', { 
        detail: { timestamp: Date.now(), conversationId }
      }));
      
      // Use the context method for the actual database update
      await markDirectConversationAsRead(conversationId);
      
      // Broadcast that messages have been read to ensure UI consistency
      window.dispatchEvent(new CustomEvent('messagesMarkedAsRead', { 
        detail: { conversationId, type: 'dm' } 
      }));
    } catch (error) {
      console.error('[useMessageReadStatus] Error marking DM as read:', error);
    }
  }, [markDirectConversationAsRead]);

  const markClubMessagesAsReadLegacy = useCallback(async (clubId: string, userId: string, delay = 0) => {
    // Set the club as active to prevent new messages from being marked as unread
    window.dispatchEvent(new CustomEvent('clubActive', { 
      detail: { clubId } 
    }));

    try {
      // Immediately dispatch an event to update badge counts (optimistic update)
      window.dispatchEvent(new CustomEvent('unreadMessagesUpdated', { 
        detail: { timestamp: Date.now(), clubId }
      }));
      
      // Use the context method for the actual database update
      await markClubMessagesAsRead(clubId);
      
      // Broadcast that messages have been read to ensure UI consistency
      window.dispatchEvent(new CustomEvent('messagesMarkedAsRead', { 
        detail: { clubId, type: 'club' } 
      }));
    } catch (error) {
      console.error('[useMessageReadStatus] Error marking club messages as read:', error);
    }
  }, [markClubMessagesAsRead]);

  return {
    markDirectMessagesAsRead,
    markClubMessagesAsRead: markClubMessagesAsReadLegacy
  };
};
