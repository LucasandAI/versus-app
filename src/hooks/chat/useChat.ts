
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
  
  // Get chat actions without passing currentUser
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
  
  // Add a wrapper for sending messages that updates the UI and handles the Supabase insert
  const handleSendClubMessage = useCallback(async (message: string, clubId: string) => {
    if (!message.trim() || !clubId) {
      console.log('[useChat] Cannot send empty message or missing clubId');
      return;
    }
    
    try {
      // Verify user is authenticated
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !sessionData?.session) {
        console.error('[useChat] No valid session found:', sessionError);
        toast({
          title: "Authentication Error",
          description: "You must be logged in to send messages",
          variant: "destructive"
        });
        return;
      }
      
      console.log('[useChat] Sending message to club:', { 
        clubId, 
        userId: sessionData.session.user.id,
        message: message.substring(0, 20) + (message.length > 20 ? '...' : '') 
      });
      
      // Use the sendMessageToClub function from useChatActions
      const result = await sendMessageToClub(clubId, message);
      
      if (result) {
        console.log('[useChat] Message sent successfully. The UI will be updated via realtime subscription.');
      } else {
        console.error('[useChat] Failed to send message - no result returned');
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
