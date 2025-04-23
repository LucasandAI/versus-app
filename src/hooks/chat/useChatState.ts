
import { useState, useEffect } from 'react';
import { SupportTicket } from '@/types/chat';
import { useLocalStorage } from './useLocalStorage';
import { useMessageHandling } from './useMessageHandling';
import { useUnreadNotifications } from './useUnreadNotifications';
import { useChatActions } from './useChatActions';
import { useChatDeletion } from './useChatDeletion';
import { useRefreshState } from './useRefreshState';

export const useChatState = (open: boolean, onNewMessage?: (count: number) => void) => {
  const [supportTickets, setSupportTickets] = useState<Record<string, any>>({});
  
  const {
    loadFromStorage,
    saveMessages,
    saveUnreadMessages,
    saveSupportTickets
  } = useLocalStorage();

  const { unreadMessages, updateUnreadCount } = useUnreadNotifications(open, onNewMessage);
  const { messages, setMessages, handleNewMessage } = useMessageHandling(saveMessages, updateUnreadCount);
  const { sendMessageToClub } = useChatActions();
  const { deleteChat } = useChatDeletion(saveMessages, saveSupportTickets, saveUnreadMessages);
  const { refreshKey, refreshChats } = useRefreshState();

  // Load data from localStorage on mount
  useEffect(() => {
    const data = loadFromStorage();
    setMessages(data.messages);
    setSupportTickets(data.supportTickets);
  }, [loadFromStorage, setMessages]);

  const handleSendClubMessage = async (message: string, clubId: string) => {
    if (!message.trim() || !clubId) {
      console.log('[useChatState] Cannot send empty message or missing clubId');
      return;
    }
    
    console.log('[useChatState] Sending club message:', { 
      clubId, 
      messagePreview: message.substring(0, 20) + (message.length > 20 ? '...' : '') 
    });
    
    const result = await sendMessageToClub(clubId, message);
    
    if (result) {
      console.log('[useChatState] Message sent successfully');
    } else {
      console.error('[useChatState] Failed to send message - no result returned');
    }
  };

  return {
    messages,
    supportTickets,
    unreadMessages,
    refreshKey,
    refreshChats,
    handleNewMessage,
    sendMessageToClub: handleSendClubMessage,
    setUnreadMessages: updateUnreadCount,
    markTicketAsRead: (ticketId: string) => updateUnreadCount(ticketId, 0),
    deleteChat
  };
};
