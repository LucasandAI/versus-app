
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
    
    if (isVisible) {
      loadStoredTickets();
    }
    
    const handleTicketUpdated = () => {
      console.log("Ticket update event received");
      loadStoredTickets();
    };

    window.addEventListener('supportTicketCreated', handleTicketUpdated);
    window.addEventListener('ticketUpdated', handleTicketUpdated);
    window.addEventListener('notificationsUpdated', handleTicketUpdated);
    
    return () => {
      window.removeEventListener('supportTicketCreated', handleTicketUpdated);
      window.removeEventListener('ticketUpdated', handleTicketUpdated);
      window.removeEventListener('notificationsUpdated', handleTicketUpdated);
    };
  }, [isVisible, setLocalSupportTickets]);
};
