
import { useCallback } from 'react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export const useChatActions = () => {
  const sendMessageToClub = useCallback(async (clubId: string, messageText: string) => {
    try {
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !sessionData.session) {
        toast({
          title: "Authentication Error",
          description: "You must be logged in to send messages",
          variant: "destructive"
        });
        return null;
      }
      
      const userId = sessionData.session.user.id;
      
      console.log('[useChatActions] Sending message to club', { clubId, userId });
      
      // Insert the message
      const { data: insertedMessage, error: insertError } = await supabase
        .from('club_chat_messages')
        .insert({
          club_id: clubId,
          message: messageText,
          sender_id: userId
        })
        .select(`
          id, 
          message, 
          timestamp, 
          sender_id,
          club_id,
          sender:sender_id(id, name, avatar)
        `)
        .single();

      if (insertError) {
        console.error('[useChatActions] Error sending message:', insertError);
        toast({
          title: "Message Error",
          description: insertError.message || "Failed to send message",
          variant: "destructive"
        });
        return null;
      }

      console.log('[useChatActions] Message sent successfully:', insertedMessage);
      return insertedMessage;
    } catch (error) {
      console.error('[useChatActions] Exception sending message:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive"
      });
      return null;
    }
  }, []);

  const deleteMessage = useCallback(async (messageId: string) => {
    try {
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !sessionData.session) {
        toast({
          title: "Authentication Error", 
          description: "You must be logged in to delete messages",
          variant: "destructive"
        });
        return false;
      }
      
      console.log('[useChatActions] Deleting message', { messageId, userId: sessionData.session.user.id });
      
      const { error: deleteError } = await supabase
        .from('club_chat_messages')
        .delete()
        .eq('id', messageId);
      
      if (deleteError) {
        console.error('[useChatActions] Error deleting message:', deleteError);
        
        // Specific message for permission denied (typically from RLS)
        if (deleteError.code === '42501') {
          toast({
            title: "Permission Denied",
            description: "You can only delete your own messages",
            variant: "destructive"
          });
        } else {
          toast({
            title: "Error",
            description: deleteError.message || "Failed to delete message",
            variant: "destructive"
          });
        }
        return false;
      }
      
      console.log('[useChatActions] Message deleted successfully');
      return true;
    } catch (error) {
      console.error('[useChatActions] Exception deleting message:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive"
      });
      return false;
    }
  }, []);

  return {
    sendMessageToClub,
    deleteMessage
  };
};
