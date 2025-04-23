
import React from 'react';
import { Club } from '@/types';
import { SupportTicket } from '@/types/chat';
import ChatDrawerContent from './ChatDrawerContent';
import DMSearchPanel from './dm/DMSearchPanel';
import SupportTabContent from './support/SupportTabContent';

interface DrawerContentProps {
  activeTab: "clubs" | "dm" | "support";
  clubs: Club[];
  selectedLocalClub: Club | null;
  selectedTicket: SupportTicket | null;
  localSupportTickets: SupportTicket[];
  onSelectClub: (club: Club) => void;
  onSelectTicket: (ticket: SupportTicket) => void;
  refreshKey: number;
  messages: Record<string, any[]>;
  deleteChat: (chatId: string, isTicket: boolean) => void;
  unreadMessages: Record<string, number>;
  handleNewMessage: (chatId: string, message: any, isOpen: boolean) => void;
  markTicketAsRead: (ticketId: string) => void;
  onSendMessage: (message: string, clubId?: string) => void;
  supportMessage?: string;
  setSupportMessage?: (message: string) => void;
  handleSubmitSupportTicket?: () => Promise<void>;
  isSubmitting?: boolean;
}

const DrawerContent: React.FC<DrawerContentProps> = ({
  activeTab,
  clubs,
  selectedLocalClub,
  selectedTicket,
  localSupportTickets,
  onSelectClub,
  onSelectTicket,
  refreshKey,
  messages,
  deleteChat,
  unreadMessages,
  handleNewMessage,
  markTicketAsRead,
  onSendMessage,
  supportMessage,
  setSupportMessage,
  handleSubmitSupportTicket,
  isSubmitting
}) => {
  const handleMatchClick = (club: Club) => {
    console.log('[DrawerContent] Match clicked for club:', club.id);
  };

  const handleSelectUser = (userId: string, userName: string, userAvatar?: string) => {
    console.log('[DrawerContent] User selected:', { userId, userName });
  };

  switch (activeTab) {
    case "clubs":
      return (
        <div className="flex h-full">
          <ChatSidebarContent
            clubs={clubs}
            selectedClub={selectedLocalClub}
            selectedTicket={selectedTicket}
            supportTickets={localSupportTickets}
            onSelectClub={onSelectClub}
            onSelectTicket={onSelectTicket}
            onDeleteChat={deleteChat}
            unreadCounts={unreadMessages}
            onSelectUser={handleSelectUser}
          />
          
          <ChatDrawerContent
            selectedClub={selectedLocalClub}
            selectedTicket={selectedTicket}
            messages={messages}
            onMatchClick={handleMatchClick}
            onSelectUser={handleSelectUser}
            onSendMessage={onSendMessage}
          />
        </div>
      );
    case "dm":
      return <DMSearchPanel />;
    case "support":
      return (
        <SupportTabContent
          supportTickets={localSupportTickets}
          selectedTicket={selectedTicket}
          onSelectTicket={onSelectTicket}
          supportMessage={supportMessage}
          setSupportMessage={setSupportMessage}
          handleSubmitSupportTicket={handleSubmitSupportTicket}
          isSubmitting={isSubmitting}
          onSendMessage={onSendMessage}
        />
      );
    default:
      return null;
  }
};

export default DrawerContent;
