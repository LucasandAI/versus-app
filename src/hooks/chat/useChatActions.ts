
import { useApp } from '@/context/AppContext';
import { useUnreadMessages } from '@/context/unread-messages';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useChatActions = () => {
  const { currentUser } = useApp();
  const { markClubMessagesAsRead } = useUnreadMessages();

  /**
   * Send a message to a club chat
   */
  const sendClubMessage = async (message: string, clubId?: string) => {
    if (!message.trim() || !clubId || !currentUser?.id) {
      console.log('[sendClubMessage] Invalid parameters');
      return null;
    }

    try {
      // Insert the message into the database
      const { data, error } = await supabase.from('club_chat_messages').insert({
        message: message.trim(),
        club_id: clubId,
        sender_id: currentUser.id,
      }).select('*, sender:sender_id(*)').single();

      if (error) {
        throw error;
      }

      console.log('[sendClubMessage] Message sent:', data);
      
      // Mark messages as read since we just sent one
      markClubMessagesAsRead(clubId);
      
      return data;
    } catch (error) {
      console.error('[sendClubMessage] Error sending message:', error);
      toast.error('Failed to send message');
      return null;
    }
  };

  /**
   * Delete a message from a club chat 
   */
  const deleteMessage = async (messageId: string, setClubMessages?: React.Dispatch<React.SetStateAction<Record<string, any[]>>>) => {
    try {
      // First get the message to find which club it belongs to
      const { data: messageData, error: messageError } = await supabase
        .from('club_chat_messages')
        .select('club_id')
        .eq('id', messageId)
        .single();

      if (messageError) throw messageError;

      // Delete the message
      const { error } = await supabase
        .from('club_chat_messages')
        .delete()
        .eq('id', messageId);

      if (error) throw error;

      // If we have access to the state updater, update it
      if (setClubMessages && messageData?.club_id) {
        setClubMessages(prev => {
          const clubId = messageData.club_id;
          
          // If this club doesn't exist in state, nothing to update
          if (!prev[clubId]) return prev;
          
          // Filter out the deleted message
          const updatedMessages = prev[clubId].filter(msg => msg.id !== messageId);
          
          return {
            ...prev,
            [clubId]: updatedMessages
          };
        });
      }

      return true;
    } catch (error) {
      console.error('[deleteMessage] Error deleting message:', error);
      toast.error('Failed to delete message');
      return false;
    }
  };

  return {
    sendClubMessage,
    deleteMessage
  };
};

export default useChatActions;
