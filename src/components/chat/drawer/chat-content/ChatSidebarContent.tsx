
import React from 'react';
import { Club } from '@/types';
import { SupportTicket } from '@/types/chat';
import ChatSidebar from '../../ChatSidebar';

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
}

const ChatSidebarContent: React.FC<ChatSidebarContentProps> = ({
  clubs,
  selectedClub,
  selectedTicket,
  supportTickets,
  onSelectClub,
  onSelectTicket,
  onDeleteChat,
  unreadCounts,
  onSelectUser,
}) => {
  return (
    <ChatSidebar
      clubs={clubs}
      selectedClub={selectedClub}
      selectedTicket={selectedTicket}
      supportTickets={supportTickets}
      onSelectClub={onSelectClub}
      onSelectTicket={onSelectTicket}
      onDeleteChat={onDeleteChat}
      unreadCounts={unreadCounts}
      onSelectUser={onSelectUser}
    />
  );
};

export default ChatSidebarContent;
