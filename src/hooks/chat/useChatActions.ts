
import { useCallback } from 'react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@/types';

export const useChatActions = (currentUser: User | null) => {
  const sendMessageToClub = useCallback(async (clubId: string, messageText: string) => {
    try {
      // Get the current auth session directly
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !sessionData.session?.user) {
        console.error('Authentication error:', sessionError || 'No authenticated session found');
        toast({
          title: "Error",
          description: "You must be logged in to send messages",
          variant: "destructive"
        });
        return null;
      }
      
      const authUserId = sessionData.session.user.id;
      
      console.log('[useChatActions] Sending message with user ID:', authUserId);
      
      const { data: insertedMessage, error: insertError } = await supabase
        .from('club_chat_messages')
        .insert({
          club_id: clubId,
          message: messageText,
          sender_id: authUserId
        })
        .select();

      if (insertError) {
        console.error('Error sending message:', insertError);
        toast({
          title: "Error",
          description: "Failed to send message",
          variant: "destructive"
        });
        return null;
      }

      console.log('[useChatActions] Message inserted successfully:', insertedMessage);
      
      // Return the inserted message data
      return insertedMessage && insertedMessage.length > 0 ? insertedMessage[0] : null;
    } catch (error) {
      console.error('Exception sending message:', error);
      return null;
    }
  }, []);

  return {
    sendMessageToClub
  };
};
