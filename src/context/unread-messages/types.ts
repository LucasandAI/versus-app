
export interface UnreadMessagesContextType {
  // DM Notifications
  unreadConversations: Set<string>;
  dmUnreadCount: number;
  
  // Club Notifications
  unreadClubs: Set<string>;
  clubUnreadCount: number;
  
  // Combined total
  totalUnreadCount: number;
  
  // Mark as read functions
  markConversationAsRead: (conversationId: string) => Promise<void>;
  markClubMessagesAsRead: (clubId: string) => Promise<void>;
  
  // Mark as unread functions (for incoming messages)
  markConversationAsUnread: (conversationId: string) => void;
  markClubAsUnread: (clubId: string) => void;
  
  // Fetch unread counts from server
  fetchUnreadCounts: () => Promise<void>;
}
