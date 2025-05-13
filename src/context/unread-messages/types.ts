
export interface UnreadMessagesContextType {
  unreadClubMessages: Set<string>;
  unreadDirectMessageConversations: Set<string>;
  markClubMessagesAsRead: (clubId: string) => void;
  markDirectConversationAsRead: (conversationId: string) => void;
  unreadMessagesCount: number;
  
  // Add missing properties
  unreadConversations: Set<string>;
  unreadClubs: Set<string>;
  totalUnreadCount: number;
  clubUnreadCounts: Record<string, number>;
  directMessageUnreadCounts: Record<string, number>;
  refreshUnreadCounts: () => Promise<void>;
  fetchUnreadCounts: () => Promise<void>;
}
