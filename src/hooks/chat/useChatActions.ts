
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
      console.log('[useChat] Sending message as user:', currentUser.id);
      
      const { data, error } = await supabase
        .from('club_chat_messages')
        .insert({
          sender_id: currentUser.id,  // Explicitly using currentUser.id from users table
          club_id: clubId,
          message: messageText
        })
        .select('*, sender:sender_id(name, avatar)');

      if (error) {
        console.error('Error sending message:', error);
        toast({
          title: "Error",
          description: "Failed to send message",
          variant: "destructive"
        });
        return;
      }

      console.log('Message sent successfully:', data);
      return data;
    } catch (error) {
      console.error('Exception sending message:', error);
    }
  }, [currentUser]);

  return {
    sendMessageToClub
  };
};
