
import React from 'react';
import { Club } from '@/types';
import { SupportTicket } from '@/types/chat';
import ChatSidebar from '../ChatSidebar';

interface ChatSidebarContentProps {
  clubs: Club[];
  selectedClub: Club | null;
  selectedTicket: SupportTicket | null;
  supportTickets: SupportTicket[];
  onSelectClub: (club: Club) => void;
  onSelectTicket: (ticket: SupportTicket) => void;
  onDeleteChat?: (chatId: string, isTicket?: boolean) => void;
  unreadCounts?: Record<string, number>;
  onSelectUser: (userId: string, userName: string, userAvatar?: string) => void;
  activeTab: "clubs" | "dm" | "support";
}

const ChatSidebarContent: React.FC<ChatSidebarContentProps> = (props) => {
  return (
    <ChatSidebar {...props} />
  );
};

export default ChatSidebarContent;
