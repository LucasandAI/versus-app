
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { SupportTicket, ChatMessage } from '@/types/chat';
import { toast } from '@/hooks/use-toast';
import { useApp } from '@/context/AppContext';

export const useSupportTicketStorage = () => {
  const { currentUser } = useApp();
  const [isLoading, setIsLoading] = useState(false);

  /**
   * Fetch all support tickets from the database for the current user
   */
  const fetchTicketsFromSupabase = async () => {
    if (!currentUser) {
      console.log('[useSupportTicketStorage] No current user, not fetching tickets');
      return [];
    }
    
    try {
      setIsLoading(true);
      console.log('[useSupportTicketStorage] Fetching tickets for user:', currentUser.id);
      
      // Fetch tickets for the current user
      const { data: tickets, error } = await supabase
        .from('support_tickets')
        .select('*')
        .eq('user_id', currentUser.id)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('[useSupportTicketStorage] Error fetching tickets:', error);
        throw error;
      }
      
      console.log('[useSupportTicketStorage] Found tickets:', tickets?.length || 0);
      
      if (!tickets || tickets.length === 0) {
        localStorage.setItem('supportTickets', JSON.stringify([]));
        return [];
      }
      
      // For each ticket, fetch its messages
      const ticketsWithMessages = await Promise.all(tickets.map(async (ticket) => {
        const { data: messages, error: messagesError } = await supabase
          .from('support_messages')
          .select('*, users(name, avatar)')
          .eq('ticket_id', ticket.id)
          .order('timestamp', { ascending: true });
        
        if (messagesError) {
          console.error('[useSupportTicketStorage] Error fetching messages for ticket', ticket.id, messagesError);
          return {
            id: ticket.id,
            subject: ticket.subject,
            createdAt: ticket.created_at,
            messages: []
          };
        }
        
        // Format messages to match the ChatMessage interface
        const formattedMessages: ChatMessage[] = messages.map(msg => ({
          id: msg.id,
          text: msg.text,
          sender: {
            id: msg.sender_id || 'support',
            name: msg.is_support ? 'Support Team' : (msg.users?.name || 'You'),
            avatar: msg.is_support ? '/placeholder.svg' : (msg.users?.avatar || '/placeholder.svg')
          },
          timestamp: msg.timestamp,
          isSupport: msg.is_support
        }));
        
        // Map the database structure to our application structure
        return {
          id: ticket.id,
          subject: ticket.subject,
          createdAt: ticket.created_at,
          messages: formattedMessages
        };
      }));
      
      console.log('[useSupportTicketStorage] Processed tickets with messages:', ticketsWithMessages.length);
      
      // Update localStorage for optimistic UI
      localStorage.setItem('supportTickets', JSON.stringify(ticketsWithMessages));
      
      // Return the tickets with messages
      return ticketsWithMessages;
      
    } catch (error) {
      console.error('[useSupportTicketStorage] Error in fetchTicketsFromSupabase:', error);
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Create a new support ticket in Supabase
   */
  const createTicketInSupabase = async (subject: string, message: string) => {
    if (!currentUser) {
      toast({
        title: "Error",
        description: "You must be logged in to create a support ticket",
        variant: "destructive"
      });
      return null;
    }
    
    try {
      console.log('[useSupportTicketStorage] Creating new ticket:', subject);
      
      // Step 1: Create the ticket
      const { data: ticketData, error: ticketError } = await supabase
        .from('support_tickets')
        .insert({
          subject,
          user_id: currentUser.id
        })
        .select()
        .single();

      if (ticketError) {
        console.error('[useSupportTicketStorage] Error creating ticket:', ticketError);
        throw ticketError;
      }
      
      if (!ticketData) {
        console.error('[useSupportTicketStorage] No ticket data returned');
        throw new Error("No ticket data returned");
      }

      console.log('[useSupportTicketStorage] Ticket created:', ticketData.id);

      // Step 2: Add the initial message
      const { error: messageError } = await supabase
        .from('support_messages')
        .insert({
          ticket_id: ticketData.id,
          sender_id: currentUser.id,
          text: message,
          is_support: false
        });

      if (messageError) {
        console.error('[useSupportTicketStorage] Error adding initial message:', messageError);
        throw messageError;
      }

      // Step 3: Add auto-response
      const { error: autoResponseError } = await supabase
        .from('support_messages')
        .insert({
          ticket_id: ticketData.id,
          sender_id: null,
          text: `Thank you for contacting support about "${subject}". A support agent will review your request and respond shortly.`,
          is_support: true
        });

      if (autoResponseError) {
        console.error('[useSupportTicketStorage] Error adding auto-response:', autoResponseError);
        throw autoResponseError;
      }

      // Create optimistic ticket object
      const newTicket: SupportTicket = {
        id: ticketData.id,
        subject,
        createdAt: ticketData.created_at,
        messages: [
          {
            id: Date.now().toString(),
            text: message,
            sender: {
              id: currentUser.id,
              name: currentUser.name,
              avatar: currentUser.avatar || '/placeholder.svg'
            },
            timestamp: new Date().toISOString(),
            isSupport: false
          },
          {
            id: 'auto-' + Date.now(),
            text: `Thank you for contacting support about "${subject}". A support agent will review your request and respond shortly.`,
            sender: {
              id: 'support',
              name: 'Support Team',
              avatar: '/placeholder.svg'
            },
            timestamp: new Date(Date.now() + 1000).toISOString(),
            isSupport: true
          }
        ]
      };

      // Update localStorage for optimistic UI
      updateLocalStorageTickets(newTicket);
      
      // Dispatch events for UI updates
      window.dispatchEvent(new CustomEvent('supportTicketCreated', { 
        detail: { ticketId: ticketData.id }
      }));
      window.dispatchEvent(new Event('ticketUpdated'));
      
      console.log('[useSupportTicketStorage] Ticket creation complete');
      
      return newTicket;
    } catch (error) {
      console.error('[useSupportTicketStorage] Error in createTicketInSupabase:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create support ticket",
        variant: "destructive"
      });
      return null;
    }
  };

  /**
   * Delete a support ticket and all its messages from Supabase
   */
  const deleteTicketFromSupabase = async (ticketId: string) => {
    try {
      console.log('[useSupportTicketStorage] Deleting ticket:', ticketId);
      
      // First delete related messages
      const { error: messagesError } = await supabase
        .from('support_messages')
        .delete()
        .eq('ticket_id', ticketId);
      
      if (messagesError) {
        console.error('[useSupportTicketStorage] Error deleting messages:', messagesError);
        throw messagesError;
      }
      
      // Then delete the ticket
      const { error: ticketError } = await supabase
        .from('support_tickets')
        .delete()
        .eq('id', ticketId);
        
      if (ticketError) {
        console.error('[useSupportTicketStorage] Error deleting ticket:', ticketError);
        throw ticketError;
      }
      
      // Update localStorage for optimistic UI
      removeTicketFromLocalStorage(ticketId);
      
      // Dispatch events for UI updates
      window.dispatchEvent(new CustomEvent('supportTicketDeleted', { 
        detail: { ticketId }
      }));
      
      console.log('[useSupportTicketStorage] Ticket deletion complete');
      
      return true;
    } catch (error) {
      console.error('[useSupportTicketStorage] Error in deleteTicketFromSupabase:', error);
      toast({
        title: "Error",
        description: "Failed to delete the support ticket",
        variant: "destructive"
      });
      return false;
    }
  };

  /**
   * Send a message to a support ticket
   */
  const sendMessageToTicket = async (ticketId: string, message: string) => {
    if (!currentUser) {
      toast({
        title: "Error",
        description: "You must be logged in to send messages",
        variant: "destructive"
      });
      return false;
    }
    
    try {
      console.log('[useSupportTicketStorage] Sending message to ticket:', ticketId);
      
      // Send message to Supabase
      const { data, error } = await supabase
        .from('support_messages')
        .insert({
          ticket_id: ticketId,
          sender_id: currentUser.id,
          text: message,
          is_support: false
        })
        .select()
        .single();
        
      if (error) {
        console.error('[useSupportTicketStorage] Error sending message:', error);
        throw error;
      }
      
      // Create optimistic message
      const optimisticMessage = {
        id: data?.id || `temp-${Date.now()}`,
        text: message,
        sender: {
          id: currentUser.id,
          name: currentUser.name,
          avatar: currentUser.avatar || '/placeholder.svg'
        },
        timestamp: new Date().toISOString(),
        isSupport: false
      };
      
      // Update localStorage for optimistic UI
      addMessageToLocalStorageTicket(ticketId, optimisticMessage);
      
      // Dispatch events for UI updates
      window.dispatchEvent(new CustomEvent('ticketUpdated', { 
        detail: { ticketId }
      }));
      
      console.log('[useSupportTicketStorage] Message sent successfully');
      
      return true;
    } catch (error) {
      console.error('[useSupportTicketStorage] Error in sendMessageToTicket:', error);
      toast({
        title: "Error",
        description: "Message sent but failed to sync with server",
        variant: "destructive"
      });
      return false;
    }
  };

  /**
   * Helper: Update localStorage with new ticket
   */
  const updateLocalStorageTickets = (newTicket: SupportTicket) => {
    try {
      const storedTickets = localStorage.getItem('supportTickets');
      const tickets = storedTickets ? JSON.parse(storedTickets) : [];
      localStorage.setItem('supportTickets', JSON.stringify([newTicket, ...tickets]));
    } catch (error) {
      console.error('[useSupportTicketStorage] Error updating localStorage:', error);
    }
  };

  /**
   * Helper: Remove ticket from localStorage
   */
  const removeTicketFromLocalStorage = (ticketId: string) => {
    try {
      const storedTickets = localStorage.getItem('supportTickets');
      if (storedTickets) {
        const tickets = JSON.parse(storedTickets);
        const updatedTickets = tickets.filter((t: SupportTicket) => t.id !== ticketId);
        localStorage.setItem('supportTickets', JSON.stringify(updatedTickets));
      }
    } catch (error) {
      console.error('[useSupportTicketStorage] Error removing ticket from localStorage:', error);
    }
  };

  /**
   * Helper: Add message to ticket in localStorage
   */
  const addMessageToLocalStorageTicket = (ticketId: string, message: ChatMessage) => {
    try {
      const storedTickets = localStorage.getItem('supportTickets');
      if (storedTickets) {
        const tickets = JSON.parse(storedTickets);
        const updatedTickets = tickets.map((t: SupportTicket) => {
          if (t.id === ticketId) {
            return {
              ...t,
              messages: [...t.messages, message]
            };
          }
          return t;
        });
        localStorage.setItem('supportTickets', JSON.stringify(updatedTickets));
      }
    } catch (error) {
      console.error('[useSupportTicketStorage] Error adding message to localStorage:', error);
    }
  };

  return {
    isLoading,
    fetchTicketsFromSupabase,
    createTicketInSupabase,
    deleteTicketFromSupabase,
    sendMessageToTicket
  };
};
