
import { useCallback } from 'react';
import { useApp } from '@/context/AppContext';
import { SupportTicket } from '@/types/chat';
import { supabase } from '@/integrations/supabase/client';

export const useChatMessages = (
  selectedTicket: SupportTicket | null,
  onSelectTicket: (ticket: SupportTicket) => void,
  handleNewMessage: (chatId: string, message: any, isOpen: boolean) => void,
  currentUser: any
) => {
  const handleSendMessage = useCallback(async (message: string) => {
    if (!currentUser) return;

    if (selectedTicket) {
      // Handle sending support ticket message
      try {
        const newMessage = {
          id: Date.now().toString(),
          text: message,
          sender: {
            id: currentUser.id,
            name: currentUser.name,
            avatar: currentUser.avatar || '/placeholder.svg'
          },
          timestamp: new Date().toISOString(),
          isSupport: false
        };
        
        // First update the UI
        const updatedTicket = {
          ...selectedTicket,
          messages: [...selectedTicket.messages, newMessage]
        };
        
        onSelectTicket(updatedTicket);
        
        // Then store in Supabase
        const { error } = await supabase
          .from('support_messages')
          .insert({
            text: message,
            sender_id: currentUser.id,
            ticket_id: selectedTicket.id,
            is_support: false
          });
          
        if (error) {
          console.error('Error sending support message:', error);
        }
      } catch (error) {
        console.error('Error in handleSendMessage for support ticket:', error);
      }
    }
  }, [currentUser, selectedTicket, onSelectTicket]);

  return {
    handleSendMessage
  };
};

