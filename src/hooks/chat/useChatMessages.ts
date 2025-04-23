
import { useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { SupportTicket } from '@/types/chat';

export const useChatMessages = (
  selectedTicket: SupportTicket | null,
  onSelectTicket: (ticket: SupportTicket) => void,
  handleNewMessage: (chatId: string, message: any, isOpen: boolean) => void,
  currentUser: any
) => {
  useEffect(() => {
    if (!selectedTicket) return;
    
    // Set up a real-time subscription to the support_messages table
    const channel = supabase
      .channel(`support_messages_${selectedTicket.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'support_messages',
          filter: `ticket_id=eq.${selectedTicket.id}`,
        },
        (payload) => {
          if (payload.new) {
            // Format the new message
            const newMessage = {
              id: payload.new.id,
              text: payload.new.text,
              sender: {
                id: payload.new.sender_id,
                name: payload.new.sender_id === payload.new.sender_id 
                  ? 'You'
                  : payload.new.sender_id === 'system'
                  ? 'Support Team'
                  : 'Support Agent',
                avatar: payload.new.sender_id === payload.new.sender_id
                  ? currentUser?.avatar || '/placeholder.svg'
                  : '/placeholder.svg'
              },
              timestamp: payload.new.timestamp,
              isSupport: payload.new.is_support
            };
            
            // Update the ticket with the new message
            if (selectedTicket) {
              const updatedTicket = {
                ...selectedTicket,
                messages: [...selectedTicket.messages, newMessage]
              };
              
              // Update the selected ticket
              onSelectTicket(updatedTicket);
              
              // Update the ticket in localStorage to ensure persistence
              try {
                const storedTickets = localStorage.getItem('supportTickets');
                if (storedTickets) {
                  const parsedTickets = JSON.parse(storedTickets);
                  const updatedTickets = parsedTickets.map((t: SupportTicket) => 
                    t.id === selectedTicket.id ? updatedTicket : t
                  );
                  localStorage.setItem('supportTickets', JSON.stringify(updatedTickets));
                }
              } catch (error) {
                console.error('Error updating localStorage tickets:', error);
              }
              
              // Trigger event to notify other components
              const event = new CustomEvent('ticketUpdated', { 
                detail: { ticketId: selectedTicket.id }
              });
              window.dispatchEvent(event);
            }
          }
        }
      )
      .subscribe();

    // Clean up subscription when component unmounts or ticket changes
    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedTicket, currentUser, onSelectTicket]);

  const handleSendMessage = useCallback(async (message: string) => {
    if (!message.trim() || !selectedTicket) return;

    try {
      // Get the current auth session directly
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session?.user?.id) {
        console.error('Cannot send message: No authenticated user found');
        return;
      }
      
      const authUserId = sessionData.session.user.id;
      
      // First update the UI immediately for better user experience
      const optimisticMessage = {
        id: `temp-${Date.now()}`,
        text: message,
        sender: {
          id: authUserId,
          name: 'You',
          avatar: currentUser?.avatar || '/placeholder.svg'
        },
        timestamp: new Date().toISOString(),
        isSupport: false
      };
      
      const updatedTicket = {
        ...selectedTicket,
        messages: [...selectedTicket.messages, optimisticMessage]
      };
      
      onSelectTicket(updatedTicket);
      
      // Then send to Supabase
      const { error } = await supabase
        .from('support_messages')
        .insert({
          text: message,
          sender_id: authUserId,
          ticket_id: selectedTicket.id,
          is_support: false
        });
        
      if (error) {
        console.error('Error sending support message:', error);
      }
    } catch (error) {
      console.error('Error in handleSendMessage for support ticket:', error);
    }
  }, [selectedTicket, currentUser, onSelectTicket]);

  return {
    handleSendMessage
  };
};
