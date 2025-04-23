
import { useCallback } from 'react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useApp } from '@/context/AppContext';

export const useChatActions = () => {
  const { currentUser } = useApp();

  const sendMessageToClub = useCallback(async (clubId: string, messageText: string) => {
    try {
      if (!currentUser) {
        throw new Error('Not authenticated');
      }
      
      // Create optimistic message
      const optimisticMessage = {
        id: `temp-${Date.now()}`,
        message: messageText,
        club_id: clubId,
        sender_id: currentUser.id,
        timestamp: new Date().toISOString(),
        sender: {
          id: currentUser.id,
          name: currentUser.name,
          avatar: currentUser.avatar
        }
      };
      
      console.log('[useChatActions] Created optimistic message:', optimisticMessage);
      
      // Update local state with optimistic message through real-time channel
      const channel = supabase.channel(`club-messages-${clubId}`);
      channel.send({
        type: 'broadcast',
        event: 'message',
        payload: { 
          new: optimisticMessage,
          eventType: 'INSERT'
        }
      });

      // Add debug log before insert attempt
      console.log('[Chat Debug] About to insert message:', { clubId, messageText });

      const { data: insertedMessage, error: insertError } = await supabase
        .from('club_chat_messages')
        .insert({
          club_id: clubId,
          message: messageText,
          sender_id: currentUser.id
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
      
      // Add debug log after insert attempt
      console.log('[Chat Debug] Insert result:', { data: insertedMessage, error: insertError });

      if (insertError) {
        console.error('[useChatActions] Error sending message:', insertError);
        
        if (insertError.code === '42501') {
          toast({
            title: "Permission Error",
            description: "You don't have permission to send messages in this club",
            variant: "destructive"
          });
        } else {
          toast({
            title: "Message Send Error",
            description: insertError.message || "Failed to send message",
            variant: "destructive"
          });
        }
        return null;
      }

      console.log('[useChatActions] Message sent successfully:', insertedMessage);
      return insertedMessage;
    } catch (error) {
      console.error('[useChatActions] Unexpected error sending message:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred while sending the message",
        variant: "destructive"
      });
      return null;
    }
  }, [currentUser]);

  const deleteMessage = useCallback(async (messageId: string) => {
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session?.user) {
        toast({
          title: "Authentication Error", 
          description: "You must be logged in to delete messages",
          variant: "destructive"
        });
        return false;
      }
      
      console.log('[useChatActions] Deleting message', { messageId, userId: session.user.id });
      
      const { error: deleteError } = await supabase
        .from('club_chat_messages')
        .delete()
        .eq('id', messageId)
        .eq('sender_id', session.user.id);  // Ensure user can only delete their own messages
      
      if (deleteError) {
        console.error('[useChatActions] Error deleting message:', deleteError);
        
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

