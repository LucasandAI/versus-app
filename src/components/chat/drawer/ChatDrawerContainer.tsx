
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
    console.log('[ChatDrawerContainer] User selected:', {
      userId,
      userName
    });
    setSelectedDMUser({
      id: userId,
      name: userName,
      avatar: userAvatar
    });
  };

  // Listen for openDirectMessage event
  useEffect(() => {
    const handleOpenDM = async (event: CustomEvent) => {
      const { userId, hasExistingChat } = event.detail;
      
      // Fetch user info if we need to open a chat
      try {
        const { data, error } = await supabase
          .from('users')
          .select('name, avatar')
          .eq('id', userId)
          .single();
          
        if (error) throw error;
        
        if (data) {
          handleSelectUser(userId, data.name, data.avatar);
        }
      } catch (err) {
        console.error('Error fetching user data for DM:', err);
      }
    };

    window.addEventListener('openDirectMessage', handleOpenDM as EventListener);
    return () => {
      window.removeEventListener('openDirectMessage', handleOpenDM as EventListener);
    };
  }, []);
  
  console.log('[ChatDrawerContainer] Rendering with messages:', messages);
  
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
              selectedTicket={selectedTicket} 
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
            <div className="w-full">
              <DMSearchPanel 
                onSelectUser={handleSelectUser}
                onDeleteChat={deleteChat}
              />
            </div>
          ) : (
            <div className="flex h-full w-full">
              <div className="w-[240px] border-r">
                <DMSearchPanel 
                  onSelectUser={handleSelectUser} 
                  selectedUserId={selectedDMUser.id}
                  onDeleteChat={deleteChat}
                />
              </div>
              <div className="flex-1">
                <DMConversation 
                  userId={selectedDMUser.id} 
                  userName={selectedDMUser.name} 
                  userAvatar={selectedDMUser.avatar} 
                />
              </div>
            </div>
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
