
import React from 'react';
import { Club } from '@/types';
import { SupportTicket } from '@/types/chat';
import { useApp } from '@/context/AppContext';
import { useChatInteractions } from '@/hooks/chat/useChatInteractions';
import { useChatMessages } from '@/hooks/chat/useChatMessages';
import ChatSidebarContent from './chat-content/ChatSidebarContent';
import ChatMainContent from './chat-content/ChatMainContent';
import ChatEmpty from '../ChatEmpty';

interface ChatDrawerContentProps {
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
  handleNewMessage: (clubId: string, message: any, isOpen: boolean) => void;
  markTicketAsRead: (ticketId: string) => void;
  onSendMessage: (message: string, clubId: string) => void;
}

const ChatDrawerContent = ({
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
}: ChatDrawerContentProps) => {
  const { currentUser } = useApp();
  const { handleMatchClick, handleSelectUser } = useChatInteractions();
  const { handleSendMessage } = useChatMessages(
    selectedTicket,
    onSelectTicket,
    handleNewMessage,
    currentUser
  );

  return (
    <div className="flex h-full" key={refreshKey}>
      <ChatSidebarContent
        clubs={currentUser?.clubs || []}
        selectedClub={selectedLocalClub}
        selectedTicket={selectedTicket}
        supportTickets={localSupportTickets}
        onSelectClub={onSelectClub}
        onSelectTicket={onSelectTicket}
        onDeleteChat={deleteChat}
        unreadCounts={unreadMessages}
        onSelectUser={handleSelectUser}
      />
      
      {(selectedLocalClub || selectedTicket) ? (
        <ChatMainContent
          selectedClub={selectedLocalClub}
          selectedTicket={selectedTicket}
          messages={messages}
          onMatchClick={handleMatchClick}
          onSelectUser={handleSelectUser}
          onSendMessage={selectedTicket ? handleSendMessage : onSendMessage}
        />
      ) : (
        <ChatEmpty />
      )}
    </div>
  );
};

export default ChatDrawerContent;
