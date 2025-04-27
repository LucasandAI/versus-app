
import { useState } from 'react';
import { useTicketCreationService } from './useTicketCreationService';
import { useTicketDeletionService } from './useTicketDeletionService';
import { useTicketMessageService } from './useTicketMessageService';
import { SupportTicket } from '@/types/chat';
import { supabase } from '@/integrations/supabase/client';
import { useApp } from '@/context/AppContext';

export const useSupportTicketStorage = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { currentUser } = useApp();
  const { createTicketInSupabase } = useTicketCreationService();
  const { deleteTicketFromSupabase } = useTicketDeletionService();
  const { sendMessageToTicket } = useTicketMessageService();

  const fetchTicketsFromSupabase = async () => {
    if (!currentUser) {
      console.log('[useSupportTicketStorage] No current user, not fetching tickets');
      return [];
    }
    
    try {
      setIsLoading(true);
      console.log('[useSupportTicketStorage] Fetching tickets for user:', currentUser.id);
      
      const { data: tickets, error } = await supabase
        .from('support_tickets')
        .select('*')
        .eq('user_id', currentUser.id)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('[useSupportTicketStorage] Error fetching tickets:', error);
        throw error;
      }
      
      if (!tickets || tickets.length === 0) {
        return [];
      }
      
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
        
        const formattedMessages = messages.map(msg => ({
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
        
        return {
          id: ticket.id,
          subject: ticket.subject,
          createdAt: ticket.created_at,
          messages: formattedMessages
        };
      }));
      
      return ticketsWithMessages;
    } catch (error) {
      console.error('[useSupportTicketStorage] Error:', error);
      return [];
    } finally {
      setIsLoading(false);
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
