
import { useState, useEffect } from 'react';
import { ChatMessage, ChatState } from '@/types/chat';
import { Club } from '@/types';

export const useChat = (open: boolean, onNewMessage?: (count: number) => void) => {
  const [messages, setMessages] = useState<Record<string, ChatMessage[]>>({});
  const [unreadMessages, setUnreadMessages] = useState<Record<string, number>>({});
  const [refreshKey, setRefreshKey] = useState(Date.now());

  useEffect(() => {
    if (open) {
      setRefreshKey(Date.now());
      if (onNewMessage) {
        onNewMessage(0);
      }
      setUnreadMessages({});
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

  return {
    messages,
    unreadMessages,
    refreshKey,
    handleNewMessage,
    setUnreadMessages
  };
};

export type ChatHookReturn = ReturnType<typeof useChat>;
