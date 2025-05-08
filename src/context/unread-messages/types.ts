
export interface UnreadMessagesContextType {
  totalUnreadCount: number;
  clubUnreadCounts: Record<string, number>;
  directMessageUnreadCounts: Record<string, number>;
  refreshUnreadCounts: () => Promise<void>;
  
  // Consolidated properties
  unreadConversations: Set<string>;
  unreadClubs: Set<string>;
  markClubMessagesAsRead: (clubId: string) => Promise<void>;
  markConversationAsRead: (conversationId: string) => Promise<void>;
  fetchUnreadCounts: () => Promise<void>;
}
