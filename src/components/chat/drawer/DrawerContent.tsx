
import React from 'react';
import { Club } from '@/types';
import { SupportTicket } from '@/types/chat';
import DMSearchPanel from './dm/DMSearchPanel';
import SupportTabContent from './support/SupportTabContent';
import ChatDrawerContent from './ChatDrawerContent';

interface DrawerContentProps {
  activeTab: "clubs" | "dm" | "support";
  clubs: Club[];
  selectedLocalClub: Club | null;
  selectedTicket: SupportTicket | null;
  localSupportTickets: SupportTicket[];
  onSelectClub: (club: Club) => void;
  onSelectTicket: (ticket: SupportTicket | null) => void;
  refreshKey: number;
  messages: Record<string, any[]>;
  deleteChat: (chatId: string, isTicket: boolean) => void;
  unreadMessages: Record<string, number>;
  handleNewMessage: (clubId: string, message: any, isOpen: boolean) => void;
  markTicketAsRead: (ticketId: string) => void;
  onSendMessage: (message: string, clubId: string) => void;
  supportMessage: string;
  setSupportMessage: (message: string) => void;
  handleSubmitSupportTicket: () => void;
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
  isSubmitting = false
}) => {
  return (
    <div className="flex-1 overflow-auto">
      {activeTab === "clubs" && (
        <ChatDrawerContent 
          clubs={clubs}
          selectedLocalClub={selectedLocalClub}
          selectedTicket={null}
          localSupportTickets={[]}
          onSelectClub={onSelectClub}
          onSelectTicket={onSelectTicket}
          refreshKey={refreshKey}
          messages={messages}
          deleteChat={deleteChat}
          unreadMessages={unreadMessages}
          handleNewMessage={handleNewMessage}
          markTicketAsRead={markTicketAsRead}
          onSendMessage={(message) => {
            if (selectedLocalClub && selectedLocalClub.id) {
              onSendMessage(message, selectedLocalClub.id);
            } else {
              console.error('[DrawerContent] Cannot send message: No club selected');
            }
          }}
        />
      )}
      {activeTab === "dm" && <DMSearchPanel />}
      {activeTab === "support" && (
        <SupportTabContent
          supportTickets={localSupportTickets}
          selectedTicket={selectedTicket}
          onSelectTicket={onSelectTicket}
          handleSubmitSupportTicket={handleSubmitSupportTicket}
          supportMessage={supportMessage}
          setSupportMessage={setSupportMessage}
          onSendMessage={(message) => handleNewMessage(selectedTicket?.id || '', { text: message }, true)}
          isSubmitting={isSubmitting}
        />
      )}
    </div>
  );
};

export default DrawerContent;
