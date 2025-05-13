
export interface UnreadMessagesContextType {
  unreadClubMessages: Set<string>;
  unreadDirectMessageConversations: Set<string>;
  markClubMessagesAsRead: (clubId: string) => void;
  markDirectConversationAsRead: (conversationId: string) => void;
  unreadMessagesCount: number;
}
