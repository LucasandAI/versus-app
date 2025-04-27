
import { useEffect, useState } from 'react';
import { SupportTicket, ChatMessage } from '@/types/chat';
import { useSupportTicketStorage } from './support/useSupportTicketStorage';
import { supabase } from '@/integrations/supabase/client';

export const useSupportTicketEffects = (
  isActive: boolean,
  setTickets: React.Dispatch<React.SetStateAction<SupportTicket[]>>
) => {
  const { fetchTicketsFromSupabase } = useSupportTicketStorage();
  const [initialLoadDone, setInitialLoadDone] = useState(false);

  // Effect to load tickets from Supabase when the component becomes active
  useEffect(() => {
    if (!isActive) return;
    
    const loadTickets = async () => {
      const tickets = await fetchTicketsFromSupabase();
      // The fetchTicketsFromSupabase function now handles the mapping correctly
      setTickets(tickets as SupportTicket[]);
      setInitialLoadDone(true);
    };
    
    // Initial load from localStorage for immediate display
    try {
      const storedTickets = localStorage.getItem('supportTickets');
      if (storedTickets) {
        const parsedTickets = JSON.parse(storedTickets);
        if (Array.isArray(parsedTickets) && parsedTickets.length > 0) {
          console.log("[useSupportTicketEffects] Loaded tickets from localStorage:", parsedTickets.length);
          // Ensure the parsed tickets match our SupportTicket type
          const validTickets = parsedTickets.filter(
            (ticket): ticket is SupportTicket => 
              'id' in ticket && 
              'subject' in ticket && 
              'createdAt' in ticket && 
              'messages' in ticket
          );
          setTickets(validTickets);
        }
      }
    } catch (error) {
      console.error("[useSupportTicketEffects] Error loading tickets from localStorage:", error);
    }
    
    // Then load from Supabase for up-to-date data
    loadTickets();
  }, [isActive, fetchTicketsFromSupabase]);

  // Listen for ticket updates from localStorage (optimistic UI)
  useEffect(() => {
    if (!isActive) return;
    
    const handleTicketUpdated = () => {
      try {
        const storedTickets = localStorage.getItem('supportTickets');
        if (storedTickets) {
          const parsedTickets = JSON.parse(storedTickets);
          if (Array.isArray(parsedTickets)) {
            console.log("[useSupportTicketEffects] Updating tickets after event:", parsedTickets.length);
            // Ensure the parsed tickets match our SupportTicket type
            const validTickets = parsedTickets.filter(
              (ticket): ticket is SupportTicket => 
                'id' in ticket && 
                'subject' in ticket && 
                'createdAt' in ticket && 
                'messages' in ticket
            );
            setTickets(validTickets);
          }
        }
      } catch (error) {
        console.error("[useSupportTicketEffects] Error updating tickets after event:", error);
      }
    };
    
    const handleTicketCreated = (event: CustomEvent<{ ticketId: string }>) => {
      console.log("[useSupportTicketEffects] Ticket created:", event.detail.ticketId);
      handleTicketUpdated();
    };
    
    const handleTicketDeleted = (event: CustomEvent<{ ticketId: string }>) => {
      console.log("[useSupportTicketEffects] Ticket deleted:", event.detail.ticketId);
      setTickets(current => current.filter(ticket => ticket.id !== event.detail.ticketId));
    };
    
    window.addEventListener('ticketUpdated', handleTicketUpdated);
    window.addEventListener('supportTicketCreated', handleTicketCreated as EventListener);
    window.addEventListener('supportTicketDeleted', handleTicketDeleted as EventListener);
    
    return () => {
      window.removeEventListener('ticketUpdated', handleTicketUpdated);
      window.removeEventListener('supportTicketCreated', handleTicketCreated as EventListener);
      window.removeEventListener('supportTicketDeleted', handleTicketDeleted as EventListener);
    };
  }, [isActive, setTickets]);

  // Real-time subscription for new support messages
  useEffect(() => {
    if (!isActive || !initialLoadDone) return;
    
    // Use Supabase real-time subscription for messages
    const subscription = supabase
      .channel('support_messages_changes')
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'support_messages'
        },
        async (payload) => {
          console.log('[useSupportTicketEffects] New support message:', payload);
          
          // Refresh tickets to get the latest messages
          const tickets = await fetchTicketsFromSupabase();
          setTickets(tickets as SupportTicket[]);
        }
      )
      .subscribe();
    
    return () => {
      supabase.removeChannel(subscription);
    };
  }, [isActive, initialLoadDone, fetchTicketsFromSupabase]);
};

export default useSupportTicketEffects;
