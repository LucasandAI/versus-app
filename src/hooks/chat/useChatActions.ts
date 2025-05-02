
import { useCallback } from 'react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useApp } from '@/context/AppContext';

export const useChatActions = () => {
  const { currentUser } = useApp();

  const sendClubMessage = useCallback(async (clubId: string, messageText: string) => {
    try {
      if (!currentUser) {
        throw new Error('Not authenticated');
      }
      
      // Generate a unique temp ID for optimistic UI
      const tempId = `temp-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      
      // Create a fresh optimistic message with the current text input
      const optimisticMessage = {
        id: tempId,
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
    console.log('[useChatActions] Deleting message with ID:', messageId);
    
    // 2. Skip Supabase deletion for temp messages
    if (messageId.startsWith('temp-')) {
      console.log('[useChatActions] Skipping Supabase deletion for temp message:', messageId);
      return true;
    }

    // 3. Call Supabase for real messages
    try {
      console.log('[useChatActions] Deleting message from Supabase:', messageId);
      
      const { error } = await supabase
        .from('club_chat_messages')
        .delete()
        .eq('id', messageId);
      
      if (error) {
        console.error('[useChatActions] Error deleting message:', error);
        toast({
          title: "Delete Error",
          description: error.message || "Failed to delete message",
          variant: "destructive"
        });
        
        return false;
      }
      
      console.log('[useChatActions] Message deleted successfully:', messageId);
      return true;
    } catch (error) {
      console.error('[useChatActions] Error deleting message:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred while deleting the message",
        variant: "destructive"
      });
      return false;
    }
  }, []);

  return {
    sendClubMessage,
    deleteMessage
  };
};
