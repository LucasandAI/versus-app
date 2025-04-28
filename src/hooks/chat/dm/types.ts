export interface DMConversation {
  conversationId: string;
  userId: string;
  userName: string;
  userAvatar: string;  // Now required, use placeholder if missing
  lastMessage: string;
  timestamp: string;
  isInitiator: boolean;
}

export interface DirectMessage {
  id: string;
  text: string;
  sender_id: string;
  receiver_id: string;
  conversation_id?: string;
  timestamp: string;
}

export interface UserCache {
  [userId: string]: {
    name: string;
    avatar?: string;
  };
}
