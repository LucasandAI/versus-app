
import { createContext, useContext } from 'react';
import { UnreadMessagesContextType } from './types';

// Create the context with default values
const UnreadMessagesContext = createContext<UnreadMessagesContextType>({
  unreadConversations: new Set(),
  dmUnreadCount: 0,
  unreadMessagesPerConversation: {},
  unreadClubs: new Set(),
  clubUnreadCount: 0,
  unreadMessagesPerClub: {},
  totalUnreadCount: 0,
  markConversationAsRead: async () => {},
  markClubMessagesAsRead: async () => {},
  markConversationAsUnread: () => {},
  markClubAsUnread: () => {},
  fetchUnreadCounts: async () => {},
});

// Export the hook for consuming the context
export const useUnreadMessages = () => useContext(UnreadMessagesContext);

export default UnreadMessagesContext;
