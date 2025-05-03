
export interface UnreadMessagesContextType {
  unreadConversations: Set<string>;
  dmUnreadCount: number;
  unreadMessagesPerConversation: Record<string, number>;
  unreadClubs: Set<string>;
  clubUnreadCount: number;
  unreadMessagesPerClub: Record<string, number>;
  totalUnreadCount: number;
  markConversationAsRead: (conversationId: string) => Promise<void>;
  markClubMessagesAsRead: (clubId: string) => Promise<void>;
  markConversationAsUnread: (conversationId: string) => void;
  markClubAsUnread: (clubId: string) => void;
  fetchUnreadCounts: () => Promise<void>;
  forceRefresh: () => void;
}
