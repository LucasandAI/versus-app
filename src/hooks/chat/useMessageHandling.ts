import { useState, useCallback } from 'react';
import { ChatMessage } from '@/types/chat';
import { useUnreadMessages } from '@/context/unread-messages';

export const useMessageHandling = (
  saveMessages: (messages: Record<string, ChatMessage[]>) => void,
  updateUnreadCount: (chatId: string, count: number) => void
) => {
  const [messages, setMessages] = useState<Record<string, ChatMessage[]>>({});
  const { markClubAsUnread, updateClubUnreadState, updateClubUnreadCount } = useUnreadMessages();

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
      
      // Update club unread state for UI components
      updateClubUnreadState(clubId, true);
      
      // Update club unread count for UI components
      updateClubUnreadCount(clubId, 1);
      
      // Dispatch event for UI updates
      window.dispatchEvent(new CustomEvent('clubMessageReceived', {
        detail: { 
          clubId,
          message,
          unread: true,
          unreadCount: 1
        }
      }));
    }
  }, [saveMessages, updateUnreadCount, markClubAsUnread, updateClubUnreadState, updateClubUnreadCount]);

  return {
    messages,
    setMessages,
    handleNewMessage
  };
};
