
import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useApp } from '@/context/AppContext';

export const useMessageSubmission = () => {
  const { currentUser } = useApp();

  const sendSupportMessage = useCallback(async (ticketId: string, message: string) => {
    if (!currentUser) {
      toast({
        title: "Authentication Error",
        description: "You must be logged in to send messages",
        variant: "destructive"
      });
      return false;
    }

    if (ticketId.startsWith('support-') || ticketId.startsWith('temp-')) {
      toast({
        title: "Error",
        description: "Cannot send messages until ticket is fully created",
        variant: "destructive"
      });
      return false;
    }

    try {
      // Send to Supabase in the background
      const { error } = await supabase
        .from('support_messages')
        .insert({
          ticket_id: ticketId,
          sender_id: currentUser.id,
          text: message,
          is_support: false
        });
        
      if (error) {
        console.error('Error sending support message:', error);
        toast({
          title: "Error",
          description: "Message sent but failed to sync with server",
          variant: "destructive"
        });
      }

      return true;
    } catch (error) {
      console.error('Error in sendSupportMessage:', error);
      toast({
        title: "Error",
        description: "Message sent but failed to sync with server",
        variant: "destructive"
      });
      return false;
    }
  }, [currentUser]);

  return { sendSupportMessage };
};
