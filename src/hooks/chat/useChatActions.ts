
import { useCallback } from 'react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@/types';

export const useChatActions = (_currentUser: User | null) => {
  // IMPORTANT: We're removing the dependency on currentUser from props
  // and only using the auth session from Supabase
  
  const sendMessageToClub = useCallback(async (clubId: string, messageText: string) => {
    try {
      // Always get the current session for every operation
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !sessionData.session) {
        console.error('[useChatActions] Auth session error:', sessionError || 'No authenticated session');
        toast({
          title: "Authentication Error",
          description: "You must be logged in to send messages",
          variant: "destructive"
        });
        return null;
      }
      
      // Log the current user ID from the session for debugging
      console.log('[useChatActions] Current authenticated user ID:', sessionData.session.user.id);
      
      // Let the RLS policy handle the auth.uid() check, but explicitly set sender_id too
      const { data: insertedMessage, error: insertError } = await supabase
        .from('club_chat_messages')
        .insert({
          club_id: clubId,
          message: messageText,
          sender_id: sessionData.session.user.id // Explicitly set to match auth.uid()
        })
        .select();

      if (insertError) {
        console.error('[useChatActions] Error sending message:', insertError);
        toast({
          title: "Message Error",
          description: insertError.message || "Failed to send message",
          variant: "destructive"
        });
        return null;
      }

      console.log('[useChatActions] Message inserted successfully:', insertedMessage);
      return insertedMessage && insertedMessage.length > 0 ? insertedMessage[0] : null;
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

  // Update delete message function to also use current session
  const deleteMessage = useCallback(async (messageId: string) => {
    try {
      // Always get current session to ensure we're authenticated
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !sessionData.session) {
        console.error('[useChatActions] Auth session error:', sessionError || 'No authenticated session');
        toast({
          title: "Authentication Error", 
          description: "You must be logged in to delete messages",
          variant: "destructive"
        });
        return false;
      }
      
      console.log('[useChatActions] Deleting message:', messageId, 'as user:', sessionData.session.user.id);
      
      // Delete message - the RLS policy will check if sender_id = auth.uid()
      // or if the user is a club admin
      const { error: deleteError } = await supabase
        .from('club_chat_messages')
        .delete()
        .eq('id', messageId);
      
      if (deleteError) {
        console.error('[useChatActions] Error deleting message:', deleteError);
        
        // Message for permission denied (typically from RLS)
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
