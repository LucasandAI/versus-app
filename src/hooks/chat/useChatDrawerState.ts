
import { useState, useEffect } from 'react';
import { Club } from '@/types';
import { SupportTicket } from '@/types/chat';

export const useChatDrawerState = (open: boolean, supportTickets: SupportTicket[] = []) => {
  const [selectedLocalClub, setSelectedLocalClub] = useState<Club | null>(null);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [localSupportTickets, setLocalSupportTickets] = useState<SupportTicket[]>(supportTickets);

  useEffect(() => {
    if (open) {
      const storedTickets = localStorage.getItem('supportTickets');
      if (storedTickets) {
        try {
          const parsedTickets = JSON.parse(storedTickets);
          setLocalSupportTickets(parsedTickets);
        } catch (error) {
          console.error("Error parsing support tickets:", error);
        }
      }
    }
  }, [open, supportTickets]);

  const handleSelectClub = (club: Club) => {
    setSelectedLocalClub(club);
    setSelectedTicket(null);
  };

  const handleSelectTicket = (ticket: SupportTicket) => {
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
