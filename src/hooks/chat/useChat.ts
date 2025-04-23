
import { useState, useEffect, useCallback } from 'react';
import { useApp } from '@/context/AppContext';
import { useLocalStorage } from './useLocalStorage';
import { useMessages } from './useMessages';
import { useUnreadNotifications } from './useUnreadNotifications';
import { useChatActions } from './useChatActions';
import { useChatDeletion } from './useChatDeletion';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

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
  
  // Get chat actions
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
  
  // Create a wrapper for sending messages that passes the message directly to useChatActions
  const handleSendClubMessage = useCallback(async (message: string, clubId: string) => {
    if (!message.trim() || !clubId) {
      console.log('[useChat] Cannot send empty message or missing clubId');
      return;
    }
    
    console.log('[useChat] DIRECT handleSendClubMessage called:', { 
      clubId, 
      messagePreview: message.substring(0, 20) + (message.length > 20 ? '...' : '') 
    });
    
    // Directly call the sendMessageToClub function from useChatActions
    const result = await sendMessageToClub(clubId, message);
    
    if (result) {
      console.log('[useChat] Message sent successfully');
    } else {
      console.error('[useChat] Failed to send message - no result returned');
    }
  }, [sendMessageToClub]);

  return {
    messages,
    supportTickets,
    unreadMessages,
    refreshKey,
    refreshChats,
    handleNewMessage,
    sendMessageToClub: handleSendClubMessage,  // Use our wrapped function
    setUnreadMessages: updateUnreadCount,
    markTicketAsRead: (ticketId: string) => updateUnreadCount(ticketId, 0),
    deleteChat
  };
};

export type ChatHookReturn = ReturnType<typeof useChat>;
