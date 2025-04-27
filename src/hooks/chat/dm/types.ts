
export interface DMConversation {
  userId: string;         // The ID of the other user (conversation partner)
  userName: string;       // The name of the other user
  userAvatar?: string;    // The avatar of the other user
  lastMessage?: string;   // The last message in the conversation
  timestamp?: string;     // Timestamp of the last message
  isInitiator?: boolean;  // Whether the current user initiated the conversation
}

export interface UserCacheItem {
  name: string;
  avatar?: string;
}

export type UserCache = Record<string, UserCacheItem>;
