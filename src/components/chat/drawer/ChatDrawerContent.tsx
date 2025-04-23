
import React from 'react';
import { Club } from '@/types';
import { SupportTicket } from '@/types/chat';
import ChatTabContent from './chat-content/ChatMainContent';
import DMSearchPanel from './dm/DMSearchPanel';
import SupportTabContent from './support/SupportTabContent';

interface ChatDrawerContentProps {
  activeTab: 'clubs' | 'dm' | 'support';
  selectedClub: Club | null;
  selectedTicket: SupportTicket | null;
  messages: Record<string, any[]>;
  handleNewMessage: (chatId: string, message: any, isOpen: boolean) => void;
  markTicketAsRead: (ticketId: string) => void;
  onSendMessage: (message: string, clubId?: string) => Promise<any>;
  supportMessage: string;
  setSupportMessage: (message: string) => void;
  handleSubmitSupportTicket: () => Promise<void>;
  isSubmitting: boolean;
  setClubMessages?: React.Dispatch<React.SetStateAction<Record<string, any[]>>>;
}

const ChatDrawerContent: React.FC<ChatDrawerContentProps> = ({
  activeTab,
  selectedClub,
  selectedTicket,
  messages,
  handleNewMessage,
  markTicketAsRead,
  onSendMessage,
  supportMessage,
  setSupportMessage,
  handleSubmitSupportTicket,
  isSubmitting,
  setClubMessages
}) => {
  if (activeTab === 'clubs') {
    return (
      <ChatTabContent
        selectedClub={selectedClub}
        messages={selectedClub ? messages[selectedClub.id] || [] : []}
        onSendMessage={(message) => selectedClub ? onSendMessage(message, selectedClub.id) : Promise.resolve(null)}
        setClubMessages={setClubMessages}
      />
    );
  }

  if (activeTab === 'dm') {
    return <DMSearchPanel />;
  }

  return (
    <SupportTabContent
      selectedTicket={selectedTicket}
      onSendMessage={(message: string) => {
        onSendMessage(message).catch(console.error);
      }}
      markTicketAsRead={markTicketAsRead}
      supportMessage={supportMessage}
      setSupportMessage={setSupportMessage}
      handleSubmitSupportTicket={handleSubmitSupportTicket}
      isSubmitting={isSubmitting}
    />
  );
};

export default ChatDrawerContent;
