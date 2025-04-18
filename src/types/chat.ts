
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

export interface ChatState {
  messages: Record<string, ChatMessage[]>;
  unreadMessages: Record<string, number>;
}
