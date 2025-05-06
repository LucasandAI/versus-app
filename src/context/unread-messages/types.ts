
export interface UnreadMessagesContextType {
  totalUnreadCount: number;
  clubUnreadCounts: Record<string, number>;
  directMessageUnreadCounts: Record<string, number>;
  refreshUnreadCounts: () => Promise<void>;
}
