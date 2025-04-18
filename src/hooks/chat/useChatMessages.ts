
import { useState } from 'react';
import { SupportTicket } from '@/types/chat';

export const useChatMessages = (
  selectedTicket: SupportTicket | null,
  onSelectTicket: (ticket: SupportTicket) => void,
  handleNewMessage: (clubId: string, message: any, isOpen: boolean) => void,
  currentUser: any
) => {
  const handleSendMessage = (message: string, selectedClubId?: string) => {
    if (selectedClubId && message.trim()) {
      const newMessage = {
        id: Date.now().toString(),
        text: message,
        sender: {
          id: currentUser?.id || 'anonymous',
          name: currentUser?.name || 'Anonymous',
          avatar: currentUser?.avatar || '/placeholder.svg',
        },
        timestamp: new Date().toISOString(),
      };
      
      handleNewMessage(selectedClubId, newMessage, true);
    } 
    else if (selectedTicket && message.trim()) {
      const newMessage = {
        id: Date.now().toString(),
        text: message,
        sender: {
          id: currentUser?.id || 'anonymous',
          name: currentUser?.name || 'Anonymous',
          avatar: currentUser?.avatar || '/placeholder.svg',
        },
        timestamp: new Date().toISOString(),
        isSupport: false
      };
      
      const updatedTicket = {
        ...selectedTicket,
        messages: [...selectedTicket.messages, newMessage]
      };
      
      onSelectTicket(updatedTicket);
      
      setTimeout(() => {
        const supportResponse = {
          id: 'support-' + Date.now() + '-response',
          text: "We've received your message. Our support team will get back to you as soon as possible.",
          sender: {
            id: 'support',
            name: 'Support Team',
            avatar: '/placeholder.svg'
          },
          timestamp: new Date().toISOString(),
          isSupport: true
        };
        
        const ticketWithResponse = {
          ...updatedTicket,
          messages: [...updatedTicket.messages, supportResponse]
        };
        
        onSelectTicket(ticketWithResponse);
      }, 1000);
    }
  };

  return {
    handleSendMessage
  };
};
