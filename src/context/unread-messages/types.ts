
export interface UnreadMessagesContextType {
  unreadConversations: Set<string>;
  dmUnreadCount: number;
  unreadClubs: Set<string>;
  clubUnreadCount: number;
  totalUnreadCount: number;
  markConversationAsRead: (conversationId: string) => Promise<void>;
  markClubMessagesAsRead: (clubId: string) => Promise<void>;
  markConversationAsUnread: (conversationId: string) => void;
  markClubAsUnread: (clubId: string) => void;
  fetchUnreadCounts: () => Promise<void>;
  forceRefresh?: () => void; // Add optional force refresh method
}
