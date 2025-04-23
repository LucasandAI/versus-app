
import { useState, useEffect, useCallback } from 'react';
import { useApp } from '@/context/AppContext';
import { useLocalStorage } from './useLocalStorage';
import { useMessages } from './useMessages';
import { useUnreadNotifications } from './useUnreadNotifications';
import { useChatActions } from './useChatActions';
import { useChatDeletion } from './useChatDeletion';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

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
  
  // We still pass currentUser here but it's not used for sender_id anymore
  const { sendMessageToClub } = useChatActions(currentUser);
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
  
  // Add a wrapper for sending messages that updates the UI and handles the Supabase insert
  const handleSendClubMessage = useCallback(async (message: string, clubId: string) => {
    if (!message.trim() || !clubId) {
      console.log('[useChat] Cannot send empty message or missing clubId');
      return;
    }
    
    try {
      // Use the sendMessageToClub function from useChatActions
      const result = await sendMessageToClub(clubId, message);
      
      if (result) {
        console.log('[useChat] Message sent successfully. The UI will be updated via realtime subscription.');
      }
    } catch (error) {
      console.error('[useChat] Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive"
      });
    }
  }, [sendMessageToClub]);

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

export type ChatHookReturn = ReturnType<typeof useChat>;
