
import React from 'react';
import { Club } from '@/types';
import { SupportTicket } from '@/types/chat';
import ChatSidebar from '../ChatSidebar';

interface ChatSidebarContentProps {
  activeTab: 'clubs' | 'dm' | 'support';
  clubs: Club[];
  selectedClub: Club | null;
  selectedTicket: SupportTicket | null;
  supportTickets: SupportTicket[];
  onSelectClub: (club: Club) => void;
  onSelectTicket: (ticket: SupportTicket) => void;
  onDeleteChat?: (chatId: string, isTicket?: boolean) => void;
  unreadCounts?: Record<string, number>;
  refreshKey?: number;
  unreadMessages?: Record<string, number>;
  onSelectUser?: (userId: string, userName: string, userAvatar?: string) => void;
}

const ChatSidebarContent: React.FC<ChatSidebarContentProps> = (props) => {
  // Create a default onSelectUser function if not provided
  const enhancedProps = {
    ...props,
    onSelectUser: props.onSelectUser || ((userId: string, userName: string, userAvatar?: string) => {
      console.log("Default onSelectUser handler:", userId, userName);
    })
  };
  
  return (
    <ChatSidebar {...enhancedProps} />
  );
};

export default ChatSidebarContent;
