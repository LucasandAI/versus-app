
// This is a simplified version of the hook that only contains what's needed
// for SupportPopover to work correctly

export const useLocalStorageSync = () => {
  const updateStoredTickets = (newTicket: any) => {
    try {
      const storedTickets = localStorage.getItem('supportTickets');
      const ticketsArray = storedTickets ? JSON.parse(storedTickets) : [];
      ticketsArray.unshift(newTicket);
      localStorage.setItem('supportTickets', JSON.stringify(ticketsArray));
    } catch (error) {
      console.error("Error updating stored tickets:", error);
    }
  };

  const updateUnreadMessages = (ticketId: string) => {
    try {
      const unreadCounts = JSON.parse(localStorage.getItem('unreadMessages') || '{}');
      unreadCounts[ticketId] = (unreadCounts[ticketId] || 0) + 1;
      localStorage.setItem('unreadMessages', JSON.stringify(unreadCounts));
    } catch (error) {
      console.error("Error updating unread messages:", error);
    }
  };

  const dispatchEvents = (ticketId: string) => {
    window.dispatchEvent(new CustomEvent('supportTicketCreated', { 
      detail: { ticketId } 
    }));
    
    window.dispatchEvent(new Event('ticketUpdated'));
  };

  return {
    updateStoredTickets,
    updateUnreadMessages,
    dispatchEvents
  };
};
