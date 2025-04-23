
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

  useEffect(() => {
    setLocalClubMessages(clubMessages);
  }, [clubMessages]);

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

  const { 
    messages, 
    unreadMessages, 
    refreshKey, 
    handleNewMessage,
    markTicketAsRead,
    deleteChat,
    sendMessageToClub
  } = useChat(open, onNewMessage);

  const { handleSendMessage } = useChatMessages(
    selectedTicket,
    handleSelectTicket,
    handleNewMessage,
    currentUser
  );

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
  
  const handleSendClubMessage = async (message: string, clubId?: string) => {
    if (!clubId || !message.trim()) return;
    
    try {
      await sendMessageToClub(clubId, message);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      toast({
        title: "Message Error",
        description: `Error sending message: ${errorMessage}`,
        variant: "destructive"
      });
    }
  };

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
            messages={localClubMessages || messages}
            deleteChat={deleteChat}
            unreadMessages={unreadMessages}
            handleNewMessage={handleNewMessage}
            markTicketAsRead={markTicketAsRead}
            onSendMessage={activeTab === "clubs" ? handleSendClubMessage : handleSendMessage}
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
