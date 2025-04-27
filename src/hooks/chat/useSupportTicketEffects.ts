
import { useEffect, useCallback } from 'react';
import { SupportTicket } from '@/types/chat';
import { supabase } from '@/integrations/supabase/client';
import { useApp } from '@/context/AppContext';

export const useSupportTicketEffects = (
  isVisible: boolean,
  setLocalSupportTickets: React.Dispatch<React.SetStateAction<SupportTicket[]>>,
) => {
  const { currentUser } = useApp();

  const loadStoredTickets = useCallback(async () => {
    try {
      // First try to load from Supabase
      if (currentUser?.id) {
        const { data: ticketsData, error } = await supabase
          .from('support_tickets')
          .select('*, support_messages(*)')
          .eq('user_id', currentUser.id)
          .order('created_at', { ascending: false });

        if (!error && ticketsData && ticketsData.length > 0) {
          console.log("Loaded tickets from Supabase:", ticketsData.length);
          
          // Transform Supabase data to SupportTicket format
          const formattedTickets: SupportTicket[] = ticketsData.map((ticket: any) => ({
            id: ticket.id,
            subject: ticket.subject,
            createdAt: ticket.created_at,
            status: ticket.status,
            messages: ticket.support_messages?.map((msg: any) => ({
              id: msg.id,
              text: msg.text,
              sender: {
                id: msg.sender_id || 'system',
                name: msg.is_support ? 'Support Team' : (currentUser.name || 'You'),
                avatar: msg.is_support ? '/placeholder.svg' : (currentUser.avatar || '/placeholder.svg'),
              },
              timestamp: msg.timestamp,
              isSupport: msg.is_support
            })) || []
          }));
          
          setLocalSupportTickets(formattedTickets);
          
          // Also update localStorage for compatibility
          localStorage.setItem('supportTickets', JSON.stringify(formattedTickets));
          return;
        }
      }
      
      // Fallback to localStorage if Supabase fails or user not logged in
      const storedTickets = localStorage.getItem('supportTickets');
      if (storedTickets) {
        const parsedTickets = JSON.parse(storedTickets);
        if (Array.isArray(parsedTickets) && parsedTickets.length > 0) {
          console.log("Loaded tickets from localStorage:", parsedTickets.length);
          setLocalSupportTickets(parsedTickets);
        }
      }
    } catch (error) {
      console.error("Error loading support tickets:", error);
    }
  }, [setLocalSupportTickets, currentUser]);
  
  useEffect(() => {
    // Load tickets immediately when visible
    if (isVisible) {
      loadStoredTickets();
    }
    
    const handleTicketUpdated = () => {
      console.log("Ticket update event received");
      loadStoredTickets();
    };

    const handleTicketCreated = (event: CustomEvent) => {
      console.log("New ticket created:", event.detail);
      loadStoredTickets();
    };

    window.addEventListener('supportTicketCreated', handleTicketCreated as EventListener);
    window.addEventListener('ticketUpdated', handleTicketUpdated);
    window.addEventListener('notificationsUpdated', handleTicketUpdated);
    
    return () => {
      window.removeEventListener('supportTicketCreated', handleTicketCreated as EventListener);
      window.removeEventListener('ticketUpdated', handleTicketUpdated);
      window.removeEventListener('notificationsUpdated', handleTicketUpdated);
    };
  }, [isVisible, loadStoredTickets]);
};
