import { useCallback } from 'react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export const useChatActions = () => {
  const sendMessageToClub = useCallback(async (clubId: string, messageText: string) => {
    try {
      // Try to refresh the session before getting it
      await supabase.auth.refreshSession();
      
      // Now get the refreshed session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session?.user) {
        console.error('[useChatActions] No valid session found:', sessionError);
        toast({
          title: "Authentication Error",
          description: "You must be logged in to send messages",
          variant: "destructive"
        });
        return null;
      }
      
      const userId = session.user.id;
      console.log('✅ Session:', userId);
      
      // Get user info directly to confirm
      const { data: userData, error: userError } = await supabase.auth.getUser();
      console.log('⚡ Double check user:', userData?.user?.id, 'Error:', userError?.message);
      
      if (!userData?.user?.id) {
        console.error('[useChatActions] User ID mismatch or missing');
        toast({
          title: "Session Error",
          description: "Your session appears to be incomplete. Please refresh the page.",
          variant: "destructive"
        });
        return null;
      }
      
      console.log('[useChatActions] Sending message to club', { 
        clubId, 
        userId, 
        messageLength: messageText.length 
      });
      
      // Insert the message
      const { data: insertedMessage, error: insertError } = await supabase
        .from('club_chat_messages')
        .insert({
          club_id: clubId,
          message: messageText,
          sender_id: userId  // Explicitly use the authenticated user's ID
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

      console.log('[Insert Response]', { data: insertedMessage, insertError });

      if (insertError) {
        console.error('[useChatActions] Error sending message:', insertError);
        
        // Check if it's an RLS permission issue
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
  }, []);

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
