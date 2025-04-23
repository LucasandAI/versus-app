
import { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { useLocalStorage } from './chat/useLocalStorage';
import { useMessages } from './chat/useMessages';
import { useUnreadNotifications } from './chat/useUnreadNotifications';
import { useChatActions } from './chat/useChatActions';
import { useChatDeletion } from './chat/useChatDeletion';

export const useChat = (open: boolean, onNewMessage?: (count: number) => void) => {
  const { currentUser } = useApp();
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
  const { sendMessageToClub } = useChatActions(currentUser);
  const { deleteChat } = useChatDeletion(saveMessages, saveSupportTickets, saveUnreadMessages);

  // Load data from localStorage on mount
  useEffect(() => {
    const data = loadFromStorage();
    setMessages(data.messages);
    setSupportTickets(data.supportTickets);
  }, [loadFromStorage, setMessages]);

  return {
    messages,
    supportTickets,
    unreadMessages,
    refreshKey,
    handleNewMessage,
    sendMessageToClub,
    setUnreadMessages: updateUnreadCount,
    markTicketAsRead: (ticketId: string) => updateUnreadCount(ticketId, 0),
    deleteChat
  };
};

export type ChatHookReturn = ReturnType<typeof useChat>;
