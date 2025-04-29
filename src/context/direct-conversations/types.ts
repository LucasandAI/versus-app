
export interface Conversation {
  conversationId: string;
  userId: string;
  userName: string;
  userAvatar: string;
  lastMessage?: string;
  timestamp?: string;
}

export interface DirectConversationsContextValue {
  conversations: Conversation[];
  loading: boolean;
  hasLoaded: boolean;
  fetchConversations: (forceRefresh?: boolean) => Promise<void>;
  refreshConversations: () => Promise<void>;
  getOrCreateConversation: (userId: string, userName: string, userAvatar?: string) => Promise<Conversation | null>;
}
