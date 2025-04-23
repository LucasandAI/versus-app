
import { useEffect } from 'react';

export const useSupportTicketEffects = (
  open: boolean,
  setLocalSupportTickets: React.Dispatch<React.SetStateAction<any[]>>,
) => {
  useEffect(() => {
    const loadStoredTickets = () => {
      try {
        const storedTickets = localStorage.getItem('supportTickets');
        if (storedTickets) {
          const parsedTickets = JSON.parse(storedTickets);
          setLocalSupportTickets(parsedTickets);
        }
      } catch (error) {
        console.error("Error parsing support tickets:", error);
      }
    };
    
    if (open) {
      loadStoredTickets();
    }
    
    const handleTicketUpdated = () => loadStoredTickets();
    window.addEventListener('supportTicketCreated', handleTicketUpdated);
    window.addEventListener('notificationsUpdated', handleTicketUpdated);
    
    return () => {
      window.removeEventListener('supportTicketCreated', handleTicketUpdated);
      window.removeEventListener('notificationsUpdated', handleTicketUpdated);
    };
  }, [open, setLocalSupportTickets]);
};
