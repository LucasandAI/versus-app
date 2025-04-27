import { useEffect, useState, useRef } from 'react';
import { SupportTicket } from '@/types/chat';
import { useSupportTicketStorage } from './support/useSupportTicketStorage';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export const useSupportTicketEffects = (
  isActive: boolean,
  setTickets: React.Dispatch<React.SetStateAction<SupportTicket[]>>
) => {
  const { fetchTicketsFromSupabase } = useSupportTicketStorage();
  const [initialLoadDone, setInitialLoadDone] = useState(false);
  const toastShownRef = useRef(false);
  const fetchInProgressRef = useRef(false);

  // Effect to load tickets from Supabase when the component becomes active
  useEffect(() => {
    if (!isActive) return;
    
    let isMounted = true;
    
    const loadTickets = async () => {
      try {
        console.log('[useSupportTicketEffects] Starting to fetch tickets from Supabase');
        const tickets = await fetchTicketsFromSupabase();
        
        if (isMounted) {
          console.log('[useSupportTicketEffects] Successfully fetched tickets:', tickets.length);
          setTickets(tickets);
          setInitialLoadDone(true);
          toastShownRef.current = false;
        }
      } catch (error) {
        console.error("[useSupportTicketEffects] Error fetching tickets:", error);
        if (!toastShownRef.current && isMounted) {
          toast({
            title: "Error",
            description: "Failed to load support tickets. Please try again later.",
            variant: "destructive",
          });
          toastShownRef.current = true;
        }
      }
    };
    
    // Load tickets immediately when tab becomes active
    loadTickets();
    
    return () => {
      isMounted = false;
    };
  }, [isActive, fetchTicketsFromSupabase, setTickets]);

  // Listen for ticket updates from events (optimistic UI)
  useEffect(() => {
    if (!isActive) return;
    
    const handleTicketUpdated = () => {
      if (!fetchInProgressRef.current) {
        fetchTicketsFromSupabase()
          .then(tickets => setTickets(tickets))
          .catch(error => console.error("[useSupportTicketEffects] Error updating tickets after event:", error));
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
  }, [isActive, setTickets, fetchTicketsFromSupabase]);

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
          if (!fetchInProgressRef.current) {
            const tickets = await fetchTicketsFromSupabase();
            setTickets(tickets);
          }
        }
      )
      .subscribe();
    
    return () => {
      supabase.removeChannel(subscription);
    };
  }, [isActive, initialLoadDone, fetchTicketsFromSupabase]);
};

export default useSupportTicketEffects;
