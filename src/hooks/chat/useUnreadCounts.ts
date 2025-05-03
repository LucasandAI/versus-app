
import { useUnreadMessages } from '@/context/UnreadMessagesContext';

// This hook now just re-exports the unread state from the context
export const useUnreadCounts = () => {
  const {
    unreadConversations,
    dmUnreadCount,
    unreadClubs,
    clubUnreadCount,
    totalUnreadCount,
    markClubMessagesAsRead
  } = useUnreadMessages();
  
  return {
    totalUnreadCount,
    dmUnreadCount,
    clubUnreadCount,
    unreadConversations,
    unreadClubs,
    markClubMessagesAsRead
  };
};
