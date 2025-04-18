
import { ChatMessage, SupportTicket } from './chat';

export interface ChatStateData {
  messages: Record<string, ChatMessage[]>;
  supportTickets: Record<string, SupportTicket>;
  unreadMessages: Record<string, number>;
}

export interface ChatActions {
  handleNewMessage: (clubId: string, message: ChatMessage, isOpen: boolean) => void;
  createSupportTicket: (ticketId: string, subject: string, message: string, userId: string, userName: string, userAvatar?: string) => void;
  markTicketAsRead: (ticketId: string) => void;
  deleteChat: (chatId: string, isTicket?: boolean) => void;
}
