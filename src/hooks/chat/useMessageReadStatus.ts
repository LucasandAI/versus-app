
import { useCallback } from 'react';
import { useCoalescedReadStatus } from './messages/useCoalescedReadStatus';

export const useMessageReadStatus = () => {
  const { markConversationAsRead, markClubAsRead } = useCoalescedReadStatus();

  const markDirectMessagesAsRead = useCallback(async (conversationId: string, userId: string) => {
    await markConversationAsRead(conversationId);
  }, [markConversationAsRead]);

  const markClubMessagesAsReadLegacy = useCallback(async (clubId: string, userId: string) => {
    await markClubAsRead(clubId);
  }, [markClubAsRead]);

  return {
    markDirectMessagesAsRead,
    markClubMessagesAsRead: markClubMessagesAsReadLegacy
  };
};
