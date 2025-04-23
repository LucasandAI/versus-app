
import { useCallback } from 'react';

export const useChatDeletion = (
  saveMessages: (messages: Record<string, any[]>) => void,
  saveSupportTickets: (tickets: Record<string, any>) => void,
  saveUnreadMessages: (unreadMessages: Record<string, number>) => void
) => {
  const deleteChat = useCallback((chatId: string, isTicket: boolean = false) => {
    if (isTicket) {
      const tickets = JSON.parse(localStorage.getItem('supportTickets') || '{}');
      const updated = { ...tickets };
      delete updated[chatId];
      saveSupportTickets(updated);
    } else {
      const messages = JSON.parse(localStorage.getItem('chatMessages') || '{}');
      const updated = { ...messages };
      delete updated[chatId];
      saveMessages(updated);
    }
    
    const unreadMessages = JSON.parse(localStorage.getItem('unreadMessages') || '{}');
    const updatedUnread = { ...unreadMessages };
    delete updatedUnread[chatId];
    saveUnreadMessages(updatedUnread);
  }, [saveMessages, saveSupportTickets, saveUnreadMessages]);

  return { deleteChat };
};
