
export interface DMConversation {
  userId: string;
  userName: string;
  userAvatar?: string;
  lastMessage?: string;
  timestamp?: string;
}

export interface UserCacheItem {
  name: string;
  avatar?: string;
}

export type UserCache = Record<string, UserCacheItem>;
