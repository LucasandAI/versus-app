
import { useEffect } from 'react';
import { SupportTicket } from '@/types/chat';

export const useSupportTicketEffects = (
  isActive: boolean,
  setTickets: React.Dispatch<React.SetStateAction<SupportTicket[]>>
) => {
  // Effect to refresh tickets from localStorage when needed
  useEffect(() => {
    if (!isActive) return;
    
    try {
      const storedTickets = localStorage.getItem('supportTickets');
      if (storedTickets) {
        const parsedTickets = JSON.parse(storedTickets);
        if (Array.isArray(parsedTickets) && parsedTickets.length > 0) {
          console.log("[useSupportTicketEffects] Loaded tickets from localStorage:", parsedTickets.length);
          setTickets(parsedTickets);
        }
      }
    } catch (error) {
      console.error("[useSupportTicketEffects] Error loading tickets from localStorage:", error);
    }
  }, [isActive]);

  // Listen for ticket updates
  useEffect(() => {
    if (!isActive) return;
    
    const handleTicketUpdated = () => {
      try {
        const storedTickets = localStorage.getItem('supportTickets');
        if (storedTickets) {
          const parsedTickets = JSON.parse(storedTickets);
          if (Array.isArray(parsedTickets)) {
            console.log("[useSupportTicketEffects] Updating tickets after event:", parsedTickets.length);
            setTickets(parsedTickets);
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
};

export default useSupportTicketEffects;
