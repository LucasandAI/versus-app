import { useState, useCallback } from 'react';
import { ChatMessage } from '@/types/chat';
import { useUnreadMessages } from '@/context/unread-messages';

export const useMessageHandling = (
  saveMessages: (messages: Record<string, ChatMessage[]>) => void,
  updateUnreadCount: (chatId: string, count: number) => void
) => {
  const [messages, setMessages] = useState<Record<string, ChatMessage[]>>({});
  const { markClubAsUnread } = useUnreadMessages();

  const handleNewMessage = useCallback((
    clubId: string,
    message: ChatMessage,
    isOpen: boolean
  ) => {
    console.log('[useMessageHandling] Handling new message for club:', clubId);
    
    setMessages(prev => {
      const updated = {
        ...prev,
        [clubId]: [...(prev[clubId] || []), message]
      };
      saveMessages(updated);
      return updated;
    });

    if (!isOpen) {
      // Update unread count
      updateUnreadCount(clubId, 1);
      
      // Mark club as unread for notifications
      markClubAsUnread(clubId);
      
      // Dispatch event for UI updates
      window.dispatchEvent(new CustomEvent('clubMessageReceived', {
        detail: { clubId }
      }));
    }
  }, [saveMessages, updateUnreadCount, markClubAsUnread]);

  return {
    messages,
    setMessages,
    handleNewMessage
  };
};
