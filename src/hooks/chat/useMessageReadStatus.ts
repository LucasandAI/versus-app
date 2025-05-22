
import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useUnreadMessages } from '@/context/unread-messages';
import { markClubReadLocally, markDmReadLocally } from '@/utils/chat/readStatusStorage';
import { debounce, flushDebounce } from '@/utils/chat/debounceUtils';
import { markConversationActive } from '@/utils/chat/activeConversationTracker';

// Constants for debounce delays
const READ_STATUS_DEBOUNCE_DELAY = 1000; // 1 second

export const useMessageReadStatus = () => {
  const { markDirectConversationAsRead, markClubMessagesAsRead } = useUnreadMessages();

  // Debounced database update functions
  const debouncedMarkDmReadInDb = useCallback(
    debounce('mark-dm-read', async (conversationId: string) => {
      try {
        console.log(`[useMessageReadStatus] Updating DB read status for DM ${conversationId}`);
        const { error } = await supabase.from('direct_messages_read').upsert(
          {
            conversation_id: conversationId,
            user_id: (await supabase.auth.getUser()).data.user?.id,
            last_read_timestamp: new Date().toISOString()
          },
          { onConflict: 'conversation_id,user_id' }
        );

        if (error) {
          console.error('[useMessageReadStatus] Error updating DM read status in DB:', error);
        }
      } catch (error) {
        console.error('[useMessageReadStatus] Error in debouncedMarkDmReadInDb:', error);
      }
    }, READ_STATUS_DEBOUNCE_DELAY),
    []
  );

  const debouncedMarkClubReadInDb = useCallback(
    debounce('mark-club-read', async (clubId: string) => {
      try {
        console.log(`[useMessageReadStatus] Updating DB read status for club ${clubId}`);
        const { error } = await supabase.from('club_messages_read').upsert(
          {
            club_id: clubId,
            user_id: (await supabase.auth.getUser()).data.user?.id,
            last_read_timestamp: new Date().toISOString()
          },
          { onConflict: 'club_id,user_id' }
        );

        if (error) {
          console.error('[useMessageReadStatus] Error updating club read status in DB:', error);
        }
      } catch (error) {
        console.error('[useMessageReadStatus] Error in debouncedMarkClubReadInDb:', error);
      }
    }, READ_STATUS_DEBOUNCE_DELAY),
    []
  );

  // Mark direct messages as read with local-first approach
  const markDirectMessagesAsRead = useCallback(
    async (conversationId: string, immediate: boolean = false) => {
      try {
        console.log(`[useMessageReadStatus] Marking DM ${conversationId} as read${immediate ? ' (immediate)' : ''}`);
        
        // 1. Mark the conversation as active to prevent incoming messages from being marked as unread
        markConversationActive('dm', conversationId);

        // 2. Update local storage immediately for instant UI feedback
        markDmReadLocally(conversationId);

        // 3. Use the context method for optimistic updates to any UI components
        await markDirectConversationAsRead(conversationId);

        // 4. Schedule a debounced update to the database or do it immediately
        if (immediate) {
          flushDebounce('mark-dm-read');
        } else {
          debouncedMarkDmReadInDb(conversationId);
        }
      } catch (error) {
        console.error('[useMessageReadStatus] Error marking DM as read:', error);
      }
    },
    [markDirectConversationAsRead, debouncedMarkDmReadInDb]
  );

  // Mark club messages as read with local-first approach
  const markClubMessagesAsReadNew = useCallback(
    async (clubId: string, immediate: boolean = false) => {
      try {
        console.log(`[useMessageReadStatus] Marking club ${clubId} as read${immediate ? ' (immediate)' : ''}`);
        
        // 1. Mark the club conversation as active
        markConversationActive('club', clubId);

        // 2. Update local storage immediately for instant UI feedback
        markClubReadLocally(clubId);

        // 3. Use the context method for optimistic updates to any UI components
        await markClubMessagesAsRead(clubId);

        // 4. Schedule a debounced update to the database or do it immediately
        if (immediate) {
          flushDebounce('mark-club-read');
        } else {
          debouncedMarkClubReadInDb(clubId);
        }
      } catch (error) {
        console.error('[useMessageReadStatus] Error marking club messages as read:', error);
      }
    },
    [markClubMessagesAsRead, debouncedMarkClubReadInDb]
  );

  return {
    markDirectMessagesAsRead,
    markClubMessagesAsRead: markClubMessagesAsReadNew,
    flushReadStatus: () => {
      flushDebounce('mark-dm-read');
      flushDebounce('mark-club-read');
    }
  };
};
