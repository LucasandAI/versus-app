
import { useState, useEffect } from 'react';
import { Club } from '@/types';
import { SupportTicket } from '@/types/chat';
import { supabase } from '@/integrations/supabase/client';
import { useSupportTicketStorage } from './support/useSupportTicketStorage';

export const useChatDrawerState = (open: boolean, supportTickets: SupportTicket[] = []) => {
  const [selectedLocalClub, setSelectedLocalClub] = useState<Club | null>(null);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [localSupportTickets, setLocalSupportTickets] = useState<SupportTicket[]>(supportTickets);
  const [isLoading, setIsLoading] = useState(false);
  const { fetchTicketsFromSupabase } = useSupportTicketStorage();

  // Load tickets directly from Supabase when drawer opens
  useEffect(() => {
    if (open) {
      setIsLoading(true);
      // Load tickets directly from Supabase on drawer open
      fetchTicketsFromSupabase()
        .then(tickets => {
          console.log('[useChatDrawerState] Loaded tickets from Supabase:', tickets.length);
          setLocalSupportTickets(tickets as SupportTicket[]);
          
          // If we have a selected ticket, check if it still exists
          if (selectedTicket) {
            const ticketStillExists = tickets.find((t: any) => t.id === selectedTicket.id);
            if (!ticketStillExists) {
              setSelectedTicket(null);
            }
          }
        })
        .catch(error => {
          console.error('[useChatDrawerState] Error loading tickets:', error);
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [open, fetchTicketsFromSupabase, selectedTicket]);
  
  // Listen for ticket updates
  useEffect(() => {
    const handleTicketUpdated = () => {
      setIsLoading(true);
      fetchTicketsFromSupabase()
        .then(tickets => {
          setLocalSupportTickets(tickets as SupportTicket[]);
          setIsLoading(false);
        })
        .catch(error => {
          console.error('[useChatDrawerState] Error updating tickets:', error);
          setIsLoading(false);
        });
    };
    
    const handleTicketDeleted = (event: CustomEvent) => {
      const { ticketId } = event.detail;
      // Update the local state to remove the deleted ticket
      setLocalSupportTickets(current => current.filter(ticket => ticket.id !== ticketId));
      
      // If the deleted ticket was selected, clear the selection
      if (selectedTicket && selectedTicket.id === ticketId) {
        setSelectedTicket(null);
      }
    };
    
    window.addEventListener('supportTicketCreated', handleTicketUpdated);
    window.addEventListener('notificationsUpdated', handleTicketUpdated);
    window.addEventListener('ticketUpdated', handleTicketUpdated);
    window.addEventListener('supportTicketDeleted', handleTicketDeleted as EventListener);
    
    return () => {
      window.removeEventListener('supportTicketCreated', handleTicketUpdated);
      window.removeEventListener('notificationsUpdated', handleTicketUpdated);
      window.removeEventListener('ticketUpdated', handleTicketUpdated);
      window.removeEventListener('supportTicketDeleted', handleTicketDeleted as EventListener);
    };
  }, [selectedTicket, fetchTicketsFromSupabase]);

  // Load messages from Supabase when a ticket is selected
  useEffect(() => {
    if (selectedTicket) {
      const loadTicketMessages = async () => {
        const { data: messages, error } = await supabase
          .from('support_messages')
          .select('*')
          .eq('ticket_id', selectedTicket.id)
          .order('timestamp', { ascending: true });
        
        if (error) {
          console.error('[useChatDrawerState] Error loading support messages:', error);
          return;
        }
        
        if (messages && messages.length > 0) {
          // Map messages to the expected format
          const formattedMessages = messages.map(msg => ({
            id: msg.id,
            text: msg.text,
            sender: {
              id: msg.sender_id,
              name: msg.is_support ? 'Support Team' : 'You',
              avatar: msg.is_support ? '/placeholder.svg' : '/placeholder.svg'
            },
            timestamp: msg.timestamp,
            isSupport: msg.is_support
          }));
          
          // Update the ticket with the latest messages
          const updatedTicket = {
            ...selectedTicket,
            messages: formattedMessages
          };
          
          setSelectedTicket(updatedTicket);
        }
      };
      
      loadTicketMessages();
    }
  }, [selectedTicket?.id]);

  const handleSelectClub = (club: Club) => {
    setSelectedLocalClub(club);
    setSelectedTicket(null);
  };

  const handleSelectTicket = (ticket: SupportTicket | null) => {
    console.log('[useChatDrawerState] Selecting ticket:', ticket?.id);
    
    // Force a re-render by clearing selection first if the same ticket is selected
    if (ticket && selectedTicket && ticket.id === selectedTicket.id) {
      console.log('[useChatDrawerState] Same ticket selected, forcing re-render');
      setSelectedTicket(null);
      // Use setTimeout to ensure the null state is processed before setting the new state
      setTimeout(() => {
        setSelectedTicket({...ticket}); // Create a new object reference to ensure re-render
        setSelectedLocalClub(null);
      }, 0);
    } else {
      // For new selections or clearing the selection
      setSelectedTicket(ticket ? {...ticket} : null); // Create a new object reference
      setSelectedLocalClub(null);
    }
  };

  return {
    selectedLocalClub,
    selectedTicket,
    localSupportTickets,
    isLoading,
    handleSelectClub,
    handleSelectTicket,
  };
};
