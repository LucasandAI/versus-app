
import { useEffect } from 'react';
import { SupportTicket } from '@/types/chat';

export const useSupportTicketEffects = (
  isVisible: boolean,
  setLocalSupportTickets: React.Dispatch<React.SetStateAction<SupportTicket[]>>,
) => {
  useEffect(() => {
    const loadStoredTickets = () => {
      try {
        const storedTickets = localStorage.getItem('supportTickets');
        if (storedTickets) {
          const parsedTickets = JSON.parse(storedTickets);
          if (Array.isArray(parsedTickets) && parsedTickets.length > 0) {
            console.log("Loaded tickets from localStorage:", parsedTickets.length);
            setLocalSupportTickets(parsedTickets);
          }
        }
      } catch (error) {
        console.error("Error parsing support tickets:", error);
      }
    };
    
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
  }, [isVisible, setLocalSupportTickets]);
};
