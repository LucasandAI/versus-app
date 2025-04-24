
import React, { useState, useEffect } from 'react';
import { Drawer, DrawerContent as UIDrawerContent } from '@/components/ui/drawer';
import { ChatProvider } from '@/context/ChatContext';
import { Club } from '@/types';
import { SupportTicket } from '@/types/chat';
import { toast } from '@/hooks/use-toast';
import { useChat } from '@/hooks/chat/useChat';
import { useChatDrawerState } from '@/hooks/chat/useChatDrawerState';
import { useSupportTickets } from '@/hooks/chat/useSupportTickets';
import { useClubMessages } from '@/hooks/chat/useClubMessages';
import { useSupportTicketEffects } from '@/hooks/chat/useSupportTicketEffects';
import DrawerHeader from './DrawerHeader';
import ChatDrawerContainer from './ChatDrawerContainer';
import { useApp } from '@/context/AppContext';

interface MainChatDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clubs: Club[];
  onNewMessage?: (count: number) => void;
  supportTickets?: SupportTicket[];
  clubMessages?: Record<string, any[]>;
}

const MainChatDrawer: React.FC<MainChatDrawerProps> = ({
  open,
  onOpenChange,
  clubs,
  onNewMessage,
  supportTickets = [],
  clubMessages = {}
}) => {
  const { currentUser } = useApp();
  const [activeTab, setActiveTab] = useState<"clubs"|"dm"|"support">("clubs");
  const [localSupportTickets, setLocalSupportTickets] = useState<SupportTicket[]>(supportTickets);

  // Use the club messages hook directly to handle real-time messages
  const { clubMessages: localClubMessages, setClubMessages } = useClubMessages(clubs, open, onNewMessage);

  const {
    supportMessage,
    setSupportMessage,
    selectedSupportOption,
    setSelectedSupportOption,
    handleSubmitSupportTicket,
    isSubmitting,
    sendSupportMessage
  } = useSupportTickets();

  const {
    selectedLocalClub,
    selectedTicket,
    handleSelectClub,
    handleSelectTicket,
  } = useChatDrawerState(open, localSupportTickets);

  // Debug log for selection change
  useEffect(() => {
    console.log('[MainChatDrawer] Selection changed:', { 
      selectedClub: selectedLocalClub?.id, 
      selectedTicket: selectedTicket?.id,
      activeTab
    });
  }, [selectedLocalClub, selectedTicket, activeTab]);

  // Use both hooks for chat functionality
  const chat = useChat(open, onNewMessage);
  const { 
    messages, 
    unreadMessages, 
    refreshKey, 
    handleNewMessage,
    markTicketAsRead,
    deleteChat,
  } = chat;

  const handleSendClubMessage = async (message: string, clubId?: string) => {
    if (!clubId) return;
    return chat.sendMessageToClub(message, clubId, setClubMessages);
  };

  const handleSendSupportMessage = async (message: string) => {
    if (!selectedTicket) return;
    return sendSupportMessage(selectedTicket.id, message);
  };

  useSupportTicketEffects(open, setLocalSupportTickets);

  const handleSubmitTicket = async () => {
    try {
      const newTicket = await handleSubmitSupportTicket();
      if (newTicket) {
        setActiveTab("support");
        handleSelectTicket(newTicket);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      toast({
        title: "Support Ticket Error",
        description: `Error submitting support ticket: ${errorMessage}`,
        variant: "destructive"
      });
    }
  };
  
  // Debug log to see messages being passed to container
  console.log('[MainChatDrawer] Rendering with active tab:', activeTab, 
    'selectedClub:', selectedLocalClub?.id,
    'messages count:', Object.keys(localClubMessages).length);
  
  return (
    <ChatProvider>
      <Drawer open={open} onOpenChange={onOpenChange}>
        <UIDrawerContent className="h-[80vh] rounded-t-xl p-0 flex flex-col">
          <DrawerHeader 
            activeTab={activeTab} 
            setActiveTab={setActiveTab} 
          />
          
          <ChatDrawerContainer 
            activeTab={activeTab}
            clubs={clubs}
            selectedLocalClub={selectedLocalClub}
            selectedTicket={selectedTicket}
            localSupportTickets={localSupportTickets}
            onSelectClub={handleSelectClub}
            onSelectTicket={handleSelectTicket}
            refreshKey={refreshKey}
            messages={localClubMessages}
            deleteChat={deleteChat}
            unreadMessages={unreadMessages}
            handleNewMessage={handleNewMessage}
            markTicketAsRead={markTicketAsRead}
            onSendMessage={activeTab === "support" ? 
              handleSendSupportMessage : 
              handleSendClubMessage
            }
            supportMessage={supportMessage}
            setSupportMessage={setSupportMessage}
            selectedSupportOption={selectedSupportOption}
            setSelectedSupportOption={setSelectedSupportOption}
            handleSubmitSupportTicket={handleSubmitTicket}
            isSubmitting={isSubmitting}
            setClubMessages={setClubMessages}
          />
        </UIDrawerContent>
      </Drawer>
    </ChatProvider>
  );
};

export default MainChatDrawer;
