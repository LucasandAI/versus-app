
import React from 'react';
import { Club } from '@/types';
import { SupportTicket } from '@/types/chat';
import ChatSidebarContent from './ChatSidebarContent';
import ChatDrawerContent from './ChatDrawerContent';

interface ChatDrawerContainerProps {
  activeTab: 'clubs' | 'dm' | 'support';
  clubs: Club[];
  selectedLocalClub: Club | null;
  selectedTicket: SupportTicket | null;
  localSupportTickets: SupportTicket[];
  onSelectClub: (club: Club) => void;
  onSelectTicket: (ticket: SupportTicket) => void;
  refreshKey: number;
  messages: Record<string, any[]>;
  unreadMessages: Record<string, number>;
  deleteChat: (chatId: string, isTicket?: boolean) => void;
  handleNewMessage: (chatId: string, message: any, isOpen: boolean) => void;
  markTicketAsRead: (ticketId: string) => void;
  onSendMessage: (message: string, clubId?: string) => Promise<any>;
  supportMessage: string;
  setSupportMessage: (message: string) => void;
  handleSubmitSupportTicket: () => Promise<void>;
  isSubmitting: boolean;
  setClubMessages?: React.Dispatch<React.SetStateAction<Record<string, any[]>>>;
}

const ChatDrawerContainer: React.FC<ChatDrawerContainerProps> = ({
  activeTab,
  clubs,
  selectedLocalClub,
  selectedTicket,
  localSupportTickets,
  onSelectClub,
  onSelectTicket,
  refreshKey,
  messages,
  unreadMessages,
  deleteChat,
  handleNewMessage,
  markTicketAsRead,
  onSendMessage,
  supportMessage,
  setSupportMessage,
  handleSubmitSupportTicket,
  isSubmitting,
  setClubMessages
}) => {
  return (
    <div className="flex flex-1 h-full overflow-hidden">
      {/* Sidebar */}
      <div className="w-1/3 h-full border-r border-gray-200 overflow-y-auto">
        <ChatSidebarContent
          activeTab={activeTab}
          clubs={clubs}
          onSelectClub={onSelectClub}
          selectedClub={selectedLocalClub}
          supportTickets={localSupportTickets}
          onSelectTicket={onSelectTicket}
          selectedTicket={selectedTicket}
          refreshKey={refreshKey}
          unreadMessages={unreadMessages}
        />
      </div>

      {/* Main Content Area */}
      <div className="w-2/3 h-full overflow-hidden flex flex-col">
        <ChatDrawerContent
          activeTab={activeTab}
          selectedClub={selectedLocalClub}
          selectedTicket={selectedTicket}
          messages={messages}
          handleNewMessage={handleNewMessage}
          markTicketAsRead={markTicketAsRead}
          onSendMessage={onSendMessage}
          supportMessage={supportMessage}
          setSupportMessage={setSupportMessage}
          handleSubmitSupportTicket={handleSubmitSupportTicket}
          isSubmitting={isSubmitting}
          setClubMessages={setClubMessages}
        />
      </div>
    </div>
  );
};

export default ChatDrawerContainer;
