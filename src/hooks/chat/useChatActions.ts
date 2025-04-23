
import { useCallback } from 'react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@/types';

export const useChatActions = (currentUser: User | null) => {
  const sendMessageToClub = useCallback(async (clubId: string, messageText: string) => {
    if (!currentUser?.id) {
      console.error('Cannot send message: No user ID found');
      toast({
        title: "Error",
        description: "You must be logged in to send messages",
        variant: "destructive"
      });
      return;
    }

    try {
      // Log attempt to send message
      console.log('[useChat] Attempting to send message:', {
        clubId,
        userId: currentUser.id,
        messageText
      });
      
      const { data: insertedMessage, error: insertError } = await supabase
        .from('club_chat_messages')
        .insert({
          club_id: clubId,
          message: messageText,
          sender_id: currentUser.id // This must match auth.uid() due to RLS policy
        })
        .select();

      if (insertError) {
        console.error('Error sending message:', insertError);
        toast({
          title: "Error",
          description: "Failed to send message",
          variant: "destructive"
        });
        return;
      }

      // Then fetch the complete message with sender data joined
      if (insertedMessage && insertedMessage.length > 0) {
        const { data: messageWithSender, error: fetchError } = await supabase
          .from('club_chat_messages')
          .select(`
            *,
            sender:sender_id(id, name, avatar)
          `)
          .eq('id', insertedMessage[0].id)
          .single();

        if (fetchError) {
          console.error('Error fetching sent message with sender:', fetchError);
          return insertedMessage;
        }
        
        console.log('Message sent successfully with sender data:', messageWithSender);
        return messageWithSender;
      }

      return insertedMessage;
    } catch (error) {
      console.error('Exception sending message:', error);
    }
  }, [currentUser]);

  return {
    sendMessageToClub
  };
};
