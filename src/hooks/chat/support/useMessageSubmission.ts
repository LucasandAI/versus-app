
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
      // Create optimistic message for UI
      const optimisticMessage = {
        id: `temp-${Date.now()}`,
        text: message,
        sender: {
          id: currentUser.id,
          name: currentUser.name || 'You',
          avatar: currentUser.avatar || '/placeholder.svg'
        },
        timestamp: new Date().toISOString(),
        isSupport: false
      };
      
      // Update local storage
      const existingTickets = localStorage.getItem('supportTickets');
      if (existingTickets) {
        const storedTickets = JSON.parse(existingTickets);
        const updatedTickets = storedTickets.map(ticket => {
          if (ticket.id === ticketId) {
            return {
              ...ticket,
              messages: [...(ticket.messages || []), optimisticMessage]
            };
          }
          return ticket;
        });
        localStorage.setItem('supportTickets', JSON.stringify(updatedTickets));
      }
      
      // Dispatch event to update UI
      window.dispatchEvent(new CustomEvent('supportTicketUpdated', { 
        detail: { ticketId, message: optimisticMessage }
      }));
      
      // Send to Supabase
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
          description: "Failed to send message to server, but it appears in your chat",
          variant: "destructive"
        });
      }

      return true;
    } catch (error) {
      console.error('Error sending support message:', error);
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive"
      });
      return false;
    }
  }, [currentUser]);

  return { sendSupportMessage };
};
