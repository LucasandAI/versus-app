import React, { useState, useEffect } from 'react';
import { Club } from '@/types';
import { SupportTicket } from '@/types/chat';
import ChatSidebar from '../ChatSidebar';
import DMSearchPanel from './dm/DMSearchPanel';
import DMConversation from './dm/DMConversation';
import SupportTabContent from './support/SupportTabContent';
import ChatDrawerContent from './ChatDrawerContent';
import { supabase } from '@/integrations/supabase/client';

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
  refreshKey,
  messages,
  deleteChat,
  unreadMessages,
  handleNewMessage,
  markTicketAsRead,
  onSendMessage,
  supportMessage,
  setSupportMessage,
  selectedSupportOption,
  setSelectedSupportOption,
  handleSubmitSupportTicket,
  isSubmitting,
  setClubMessages
}) => {
  const handleMatchClick = (club: Club) => {
    console.log('[ChatDrawerContainer] Match clicked for club:', club.id);
  };

  const [selectedDMUser, setSelectedDMUser] = useState<{
    id: string;
    name: string;
    avatar?: string;
  } | null>(null);

  const handleSelectUser = (userId: string, userName: string, userAvatar?: string) => {
    setSelectedDMUser({
      id: userId,
      name: userName,
      avatar: userAvatar
    });
  };

  // Only reset selection that doesn't match the current tab
  useEffect(() => {
    if (activeTab === "clubs") {
      // Keep club selection, clear ticket selection only if switching tabs
      if (selectedTicket) onSelectTicket(null as any);
      setSelectedDMUser(null);
    } else if (activeTab === "dm") {
      // Keep DM selection, clear other selections
      if (selectedLocalClub) onSelectClub(null as any);
      if (selectedTicket) onSelectTicket(null as any);
    } else if (activeTab === "support") {
      // Keep ticket selection, clear club selection only if switching tabs
      if (selectedLocalClub) onSelectClub(null as any);
      setSelectedDMUser(null);
    }
  }, [activeTab]);

  // Debug log for selections
  useEffect(() => {
    console.log('[ChatDrawerContainer] Selection changed:', {
      selectedClub: selectedLocalClub?.id,
      selectedTicket: selectedTicket?.id,
      activeTab,
    });
  }, [selectedLocalClub, selectedTicket, activeTab]);

  useEffect(() => {
    const handleOpenDM = async (event: CustomEvent) => {
      const { userId, userName, userAvatar } = event.detail;
      handleSelectUser(userId, userName, userAvatar);
    };

    window.addEventListener('openDirectMessage', handleOpenDM as EventListener);
    return () => {
      window.removeEventListener('openDirectMessage', handleOpenDM as EventListener);
    };
  }, []);
  
  console.log('[ChatDrawerContainer] Active tab:', activeTab, 
    'selectedClub:', selectedLocalClub?.id,
    'selectedTicket:', selectedTicket?.id);
  
  switch (activeTab) {
    case "clubs":
      return (
        <div className="flex h-full w-full">
          <div className="w-[240px] border-r">
            <ChatSidebar 
              clubs={clubs} 
              selectedClub={selectedLocalClub} 
              selectedTicket={selectedTicket} 
              supportTickets={localSupportTickets} 
              onSelectClub={onSelectClub} 
              onSelectTicket={onSelectTicket} 
              onDeleteChat={deleteChat} 
              unreadCounts={unreadMessages} 
              onSelectUser={handleSelectUser}
              activeTab={activeTab}
            />
          </div>
          
          <div className="flex-1">
            <ChatDrawerContent 
              selectedClub={selectedLocalClub}
              selectedTicket={null} // We're in clubs tab, so don't show tickets
              messages={messages} 
              onMatchClick={handleMatchClick} 
              onSelectUser={handleSelectUser} 
              onSendMessage={onSendMessage} 
              setClubMessages={setClubMessages}
            />
          </div>
        </div>
      );
    case "dm":
      return (
        <div className="flex h-full w-full">
          {!selectedDMUser ? (
            <DMSearchPanel />
          ) : (
            <DMConversation 
              userId={selectedDMUser.id} 
              userName={selectedDMUser.name} 
              userAvatar={selectedDMUser.avatar} 
            />
          )}
        </div>
      );
    case "support":
      return (
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
      );
    default:
      return null;
  }
};

export default ChatDrawerContainer;
