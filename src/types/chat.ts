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
}

export interface SupportTicket {
  id: string;
  subject: string;
  createdAt: string;
  status: 'open' | 'closed';
  messages: ChatMessage[];
}

export interface DirectMessage {
  id: string;
  sender_id: string;
  receiver_id: string;
  text: string;
  timestamp: string;
}

export interface ChatState {
  messages: Record<string, ChatMessage[]>;
  supportTickets: Record<string, SupportTicket>;
  unreadMessages: Record<string, number>;
}
