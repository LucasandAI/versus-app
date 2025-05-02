
export interface UnreadMessagesContextType {
  // Unread DM state
  unreadConversations: Set<string>;
  dmUnreadCount: number;
  unreadMessagesPerConversation: Record<string, number>;
  
  // Unread club message state
  unreadClubs: Set<string>;
  clubUnreadCount: number;
  unreadMessagesPerClub: Record<string, number>;
  
  // Combined state
  totalUnreadCount: number;
  
  // Actions
  markConversationAsRead: (conversationId: string) => Promise<void>;
  markClubMessagesAsRead: (clubId: string) => Promise<void>;
  markConversationAsUnread: (conversationId: string) => void;
  markClubAsUnread: (clubId: string) => void;
  fetchUnreadCounts: () => Promise<void>;
  forceRefresh: () => void;
}
