
import { createContext, useContext } from 'react';
import { UnreadMessagesContextType } from './types';

const UnreadMessagesContext = createContext<UnreadMessagesContextType>({
  unreadConversations: new Set(),
  dmUnreadCount: 0,
  unreadClubs: new Set(),
  clubUnreadCount: 0,
  totalUnreadCount: 0,
  markConversationAsRead: async () => {},
  markClubMessagesAsRead: async () => {},
  markConversationAsUnread: () => {},
  markClubAsUnread: () => {},
  fetchUnreadCounts: async () => {},
});

export const useUnreadMessages = () => useContext(UnreadMessagesContext);

export default UnreadMessagesContext;
