
import { useCallback } from 'react';
import { useCoalescedReadStatus } from './messages/useCoalescedReadStatus';

export const useMessageReadStatus = () => {
  const { markConversationAsRead, markClubAsRead } = useCoalescedReadStatus();

  // Updated to use the local-first approach for direct messages
  const markDirectMessagesAsRead = useCallback(async (conversationId: string, userId: string) => {
    // Use false for debounced database update (local storage updated immediately)
    await markConversationAsRead(conversationId, false);
  }, [markConversationAsRead]);

  // Updated to use the local-first approach for club messages
  const markClubMessagesAsReadLegacy = useCallback(async (clubId: string, userId: string) => {
    // Use false for debounced database update (local storage updated immediately)
    await markClubAsRead(clubId, false);
  }, [markClubAsRead]);

  return {
    markDirectMessagesAsRead,
    markClubMessagesAsRead: markClubMessagesAsReadLegacy
  };
};
