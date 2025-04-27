
import { useEffect, useState, useRef } from 'react';
import { SupportTicket, ChatMessage } from '@/types/chat';
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
      // Prevent multiple concurrent fetch operations
      if (fetchInProgressRef.current) return;
      
      fetchInProgressRef.current = true;
      console.log('[useSupportTicketEffects] Starting to fetch tickets from Supabase');
      
      try {
        const tickets = await fetchTicketsFromSupabase();
        
        // Only update state if component is still mounted
        if (isMounted) {
          console.log('[useSupportTicketEffects] Fetched tickets:', tickets.length);
          setTickets(tickets as SupportTicket[]);
          setInitialLoadDone(true);
          // Reset toast flag on successful load
          toastShownRef.current = false;
        }
      } catch (error) {
        console.error("[useSupportTicketEffects] Error fetching tickets:", error);
        
        // Only show toast once for the same error session
        if (!toastShownRef.current && isMounted) {
          toast({
            title: "Error",
            description: "Failed to load support tickets. Please try again later.",
            variant: "destructive",
            duration: 3000,
          });
          toastShownRef.current = true;
        }
      } finally {
        fetchInProgressRef.current = false;
      }
    };
    
    // Initial load from Supabase immediately when tab becomes active
    loadTickets();
    
    // Set up cleanup
    return () => {
      isMounted = false;
    };
  }, [isActive, fetchTicketsFromSupabase]);

  // Listen for ticket updates from events (optimistic UI)
  useEffect(() => {
    if (!isActive) return;
    
    const handleTicketUpdated = () => {
      if (!fetchInProgressRef.current) {
        fetchTicketsFromSupabase()
          .then(tickets => setTickets(tickets as SupportTicket[]))
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
            setTickets(tickets as SupportTicket[]);
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
