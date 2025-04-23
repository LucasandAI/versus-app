
import React, { useState, useEffect } from 'react';
import { Drawer, DrawerContent as UIDrawerContent } from '@/components/ui/drawer';
import { ChatProvider } from '@/context/ChatContext';
import { Club } from '@/types';
import { SupportTicket } from '@/types/chat';
import { toast } from '@/hooks/use-toast';
import { useChat } from '@/hooks/chat/useChat';
import { useChatDrawerState } from '@/hooks/chat/useChatDrawerState';
import { useChatMessages } from '@/hooks/chat/useChatMessages';
import { useSupportTickets } from '@/hooks/chat/useSupportTickets';
import { useRealtimeMessages } from '@/hooks/chat/useRealtimeMessages';
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
  const [localClubMessages, setLocalClubMessages] = useState<Record<string, any[]>>(clubMessages);

  // Update local messages whenever clubMessages prop changes
  useEffect(() => {
    if (open && Object.keys(clubMessages).length > 0) {
      console.log('[MainChatDrawer] Received updated clubMessages:', Object.keys(clubMessages).length);
      setLocalClubMessages(clubMessages);
    }
  }, [clubMessages, open]);

  const {
    supportMessage,
    setSupportMessage,
    handleSubmitSupportTicket,
    isSubmitting
  } = useSupportTickets();

  const {
    selectedLocalClub,
    selectedTicket,
    handleSelectClub,
    handleSelectTicket,
  } = useChatDrawerState(open, localSupportTickets);

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

  // Get support message handler
  const { handleSendMessage: handleSendSupportMessage } = useChatMessages(
    selectedTicket,
    handleSelectTicket,
    handleNewMessage,
    currentUser
  );

  // Extract club message handler directly from chat
  const handleSendClubMessage = chat.sendMessageToClub;

  useRealtimeMessages(open, setLocalClubMessages);
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
            onSendMessage={activeTab === "support" ? handleSendSupportMessage : handleSendClubMessage}
            supportMessage={supportMessage}
            setSupportMessage={setSupportMessage}
            handleSubmitSupportTicket={handleSubmitTicket}
            isSubmitting={isSubmitting}
          />
        </UIDrawerContent>
      </Drawer>
    </ChatProvider>
  );
};

export default MainChatDrawer;
