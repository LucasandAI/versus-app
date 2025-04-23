
import { useState, useEffect } from 'react';
import { useLocalStorage } from './useLocalStorage';
import { useMessages } from './useMessages';
import { useUnreadNotifications } from './useUnreadNotifications';
import { useChatActions } from './useChatActions';
import { useChatDeletion } from './useChatDeletion';

export const useChat = (open: boolean, onNewMessage?: (count: number) => void) => {
  const [refreshKey, setRefreshKey] = useState(Date.now());
  const [supportTickets, setSupportTickets] = useState<Record<string, any>>({});
  
  const {
    loadFromStorage,
    saveMessages,
    saveUnreadMessages,
    saveSupportTickets
  } = useLocalStorage();

  const { unreadMessages, updateUnreadCount } = useUnreadNotifications(open, onNewMessage);
  const { messages, setMessages, handleNewMessage } = useMessages(saveMessages, updateUnreadCount);
  
  // Remove the currentUser parameter since useChatActions no longer expects it
  const { sendMessageToClub } = useChatActions();
  const { deleteChat } = useChatDeletion(saveMessages, saveSupportTickets, saveUnreadMessages);

  // Load data from localStorage on mount
  useEffect(() => {
    const data = loadFromStorage();
    setMessages(data.messages);
    setSupportTickets(data.supportTickets);
  }, [loadFromStorage, setMessages]);

  const refreshChats = () => {
    setRefreshKey(Date.now());
  };

  return {
    messages,
    supportTickets,
    unreadMessages,
    refreshKey,
    refreshChats,
    handleNewMessage,
    sendMessageToClub,
    setUnreadMessages: updateUnreadCount,
    markTicketAsRead: (ticketId: string) => updateUnreadCount(ticketId, 0),
    deleteChat
  };
};

export type ChatHookReturn = ReturnType<typeof useChat>;
