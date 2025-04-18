
import { useState, useEffect } from 'react';
import { ChatMessage, ChatState, SupportTicket } from '@/types/chat';
import { Club } from '@/types';

export const useChat = (open: boolean, onNewMessage?: (count: number) => void) => {
  const [messages, setMessages] = useState<Record<string, ChatMessage[]>>({});
  const [supportTickets, setSupportTickets] = useState<Record<string, SupportTicket>>({});
  const [unreadMessages, setUnreadMessages] = useState<Record<string, number>>({});
  const [refreshKey, setRefreshKey] = useState(Date.now());

  useEffect(() => {
    if (open) {
      setRefreshKey(Date.now());
      if (onNewMessage) {
        onNewMessage(0);
      }
    }
  }, [open, onNewMessage]);

  useEffect(() => {
    if (!open && onNewMessage) {
      const totalUnread = Object.values(unreadMessages).reduce((sum, count) => sum + count, 0);
      onNewMessage(totalUnread);
    }
  }, [unreadMessages, open, onNewMessage]);

  const handleNewMessage = (clubId: string, message: ChatMessage, isOpen: boolean) => {
    setMessages(prev => ({
      ...prev,
      [clubId]: [...(prev[clubId] || []), message]
    }));

    if (!isOpen) {
      setUnreadMessages(prev => ({
        ...prev,
        [clubId]: (prev[clubId] || 0) + 1
      }));
    }
  };

  const createSupportTicket = (ticketId: string, subject: string, message: string, userId: string, userName: string, userAvatar?: string) => {
    const timestamp = new Date().toISOString();
    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      text: message,
      sender: {
        id: userId,
        name: userName,
        avatar: userAvatar
      },
      timestamp,
      isSupport: false
    };

    const ticket: SupportTicket = {
      id: ticketId,
      subject,
      createdAt: timestamp,
      messages: [newMessage]
    };

    setSupportTickets(prev => ({
      ...prev,
      [ticketId]: ticket
    }));

    // Add unread count for support tickets
    setUnreadMessages(prev => ({
      ...prev,
      [ticketId]: 1
    }));
  };

  return {
    messages,
    supportTickets,
    unreadMessages,
    refreshKey,
    handleNewMessage,
    createSupportTicket,
    setUnreadMessages
  };
};

export type ChatHookReturn = ReturnType<typeof useChat>;
