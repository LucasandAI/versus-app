
import { useState, useEffect } from 'react';
import { Club } from '@/types';
import { SupportTicket } from '@/types/chat';
import { supabase } from '@/integrations/supabase/client';

export const useChatDrawerState = (open: boolean, supportTickets: SupportTicket[] = []) => {
  const [selectedLocalClub, setSelectedLocalClub] = useState<Club | null>(null);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [localSupportTickets, setLocalSupportTickets] = useState<SupportTicket[]>(supportTickets);

  // Load tickets from localStorage when drawer opens or when tickets are updated
  useEffect(() => {
    const loadTickets = () => {
      if (open) {
        try {
          const storedTickets = localStorage.getItem('supportTickets');
          if (storedTickets) {
            const parsedTickets = JSON.parse(storedTickets);
            setLocalSupportTickets(parsedTickets);
            
            // If we have a selected ticket, update it with the latest data
            if (selectedTicket) {
              const updatedTicket = parsedTickets.find((t: SupportTicket) => t.id === selectedTicket.id);
              if (updatedTicket) {
                setSelectedTicket(updatedTicket);
              }
            }
          }
        } catch (error) {
          console.error("Error parsing support tickets:", error);
        }
      }
    };

    loadTickets();
    
    // Listen for ticket updates
    const handleTicketUpdated = () => loadTickets();
    const handleTicketDeleted = (event: CustomEvent) => {
      loadTickets();
      // If the deleted ticket was selected, clear the selection
      if (selectedTicket && selectedTicket.id === event.detail.ticketId) {
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
  }, [open, supportTickets, selectedTicket]);

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
          console.error('Error loading support messages:', error);
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
          
          // Update in localStorage
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
    setSelectedTicket(ticket);
    setSelectedLocalClub(null);
  };

  return {
    selectedLocalClub,
    selectedTicket,
    localSupportTickets,
    handleSelectClub,
    handleSelectTicket,
  };
};
