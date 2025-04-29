
import { useState, useEffect } from 'react';
import { useUnreadMessages } from '@/context/UnreadMessagesContext';

export const useUnreadChatState = () => {
  const { 
    unreadClubs, 
    unreadConversations, 
    totalUnreadCount,
    markClubMessagesAsRead,
    markConversationAsRead
  } = useUnreadMessages();
  
  // Local state to track unread status
  const [hasUnreadClubs, setHasUnreadClubs] = useState(unreadClubs.size > 0);
  const [hasUnreadConversations, setHasUnreadConversations] = useState(unreadConversations.size > 0);
  const [localUnreadCount, setLocalUnreadCount] = useState(totalUnreadCount);
  
  // Update local state when context values change
  useEffect(() => {
    setHasUnreadClubs(unreadClubs.size > 0);
    setHasUnreadConversations(unreadConversations.size > 0);
    setLocalUnreadCount(totalUnreadCount);
  }, [unreadClubs, unreadConversations, totalUnreadCount]);
  
  // Listen for global unread message updates
  useEffect(() => {
    const handleUnreadUpdated = () => {
      // Force update local state on events
      setHasUnreadClubs(unreadClubs.size > 0);
      setHasUnreadConversations(unreadConversations.size > 0);
      setLocalUnreadCount(totalUnreadCount);
    };
    
    window.addEventListener('unreadMessagesUpdated', handleUnreadUpdated);
    window.addEventListener('clubMessageReceived', handleUnreadUpdated);
    
    return () => {
      window.removeEventListener('unreadMessagesUpdated', handleUnreadUpdated);
      window.removeEventListener('clubMessageReceived', handleUnreadUpdated);
    };
  }, [unreadClubs, unreadConversations, totalUnreadCount]);
  
  return {
    hasUnreadClubs,
    hasUnreadConversations,
    localUnreadCount,
    markClubMessagesAsRead,
    markConversationAsRead
  };
};
