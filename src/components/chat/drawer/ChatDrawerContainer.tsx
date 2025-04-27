import React, { useState, useEffect } from 'react';
import { Club } from '@/types';
import { SupportTicket } from '@/types/chat';
import DMContainer from './dm/DMContainer';
import SupportTabContent from './support/SupportTabContent';
import ChatClubContainer from './club/ChatClubContainer';
import DMSearchPanel from './dm/DMSearchPanel';

interface ChatDrawerContainerProps {
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
  selectedSupportOption?: { id: string, label: string } | null;
  setSelectedSupportOption?: (option: { id: string, label: string } | null) => void;
  handleSubmitSupportTicket?: () => Promise<void>;
  isSubmitting?: boolean;
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
  messages,
  deleteChat,
  unreadMessages,
  onSendMessage,
  supportMessage,
  setSupportMessage,
  selectedSupportOption,
  setSelectedSupportOption,
  handleSubmitSupportTicket,
  isSubmitting,
  setClubMessages
}) => {
  useEffect(() => {
    if (activeTab === "clubs") {
      if (selectedTicket) onSelectTicket(null as any);
    } else if (activeTab === "dm") {
      if (selectedLocalClub) onSelectClub(null as any);
      if (selectedTicket) onSelectTicket(null as any);
    } else if (activeTab === "support") {
      if (selectedLocalClub) onSelectClub(null as any);
    }
  }, [activeTab]);

  useEffect(() => {
    console.log('[ChatDrawerContainer] Selection changed:', {
      selectedClub: selectedLocalClub?.id,
      selectedTicket: selectedTicket?.id,
      activeTab,
    });
  }, [selectedLocalClub, selectedTicket, activeTab]);
  
  switch (activeTab) {
    case "clubs":
      return (
        <div className="flex h-full w-full">
          <ChatClubContainer
            clubs={clubs}
            selectedClub={selectedLocalClub}
            onSelectClub={onSelectClub}
            messages={messages}
            onSendMessage={onSendMessage}
            unreadCounts={unreadMessages}
            onDeleteChat={deleteChat}
            setClubMessages={setClubMessages}
          />
        </div>
      );
    case "dm":
      return (
        <div className="flex h-full w-full">
          <DMSearchPanel />
        </div>
      );
    case "support":
      return (
        <div className="flex h-full w-full">
          <SupportTabContent 
            supportTickets={localSupportTickets} 
            selectedTicket={selectedTicket} 
            onSelectTicket={onSelectTicket} 
            supportMessage={supportMessage || ""} 
            setSupportMessage={setSupportMessage || (() => {})} 
            handleSubmitSupportTicket={handleSubmitSupportTicket || (async () => {})} 
            isSubmitting={isSubmitting}
            onSendMessage={onSendMessage}
            selectedSupportOption={selectedSupportOption || null}
            setSelectedSupportOption={setSelectedSupportOption || (() => {})}
            activeTab={activeTab}
          />
        </div>
      );
    default:
      return null;
  }
};

export default ChatDrawerContainer;
