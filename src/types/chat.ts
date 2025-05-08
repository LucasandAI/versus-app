
import { Club } from './index';

export interface ChatMessage {
  id: string;
  text: string;
  sender: {
    id: string;
    name: string;
    avatar?: string;
  };
  timestamp: string;
  isSupport?: boolean;
  optimistic?: boolean;
  status?: 'sending' | 'sent' | 'error';
}

export interface ClubMessage extends ChatMessage {
  clubId: string;
}

export interface DirectMessage extends ChatMessage {
  conversationId: string;
  receiverId: string;
}

// Simplified version of the old state - kept for compatibility
export interface ChatState {
  messages: Record<string, ChatMessage[]>;
  unreadMessages: Record<string, number>;
}

// Compatibility type for support tickets
export interface SupportTicket {
  id: string;
  subject: string;
  createdAt: string;
  messages: ChatMessage[];
}
