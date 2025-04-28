
import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useMessageReadStatus = () => {
  const markDirectMessagesAsRead = useCallback(async (conversationId: string, userId: string) => {
    try {
      const { error } = await supabase
        .from('direct_messages_read')
        .upsert({
          user_id: userId,
          conversation_id: conversationId,
          last_read_timestamp: new Date().toISOString()
        }, {
          onConflict: 'user_id,conversation_id'
        });

      if (error) throw error;
    } catch (error) {
      console.error('[useMessageReadStatus] Error marking DM as read:', error);
    }
  }, []);

  const markClubMessagesAsRead = useCallback(async (clubId: string, userId: string) => {
    try {
      const { error } = await supabase
        .from('club_messages_read')
        .upsert({
          user_id: userId,
          club_id: clubId,
          last_read_timestamp: new Date().toISOString()
        }, {
          onConflict: 'user_id,club_id'
        });

      if (error) throw error;
    } catch (error) {
      console.error('[useMessageReadStatus] Error marking club messages as read:', error);
    }
  }, []);

  return {
    markDirectMessagesAsRead,
    markClubMessagesAsRead
  };
};
