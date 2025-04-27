
import React, { useState, useEffect } from 'react';
import { Club } from '@/types';
import { SupportTicket } from '@/types/chat';
import ChatDrawerContainer from './ChatDrawerContainer';
import DrawerHeader from './DrawerHeader';
import { ChatProvider } from '@/context/ChatContext';
import { Drawer, DrawerContent } from '@/components/ui/drawer';
import { useSupportTickets } from '@/hooks/chat/useSupportTickets';
import { useChatDrawerState } from '@/hooks/chat/useChatDrawerState';

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
  const [activeTab, setActiveTab] = useState<"clubs"|"dm"|"support">("clubs");
  const [directMessageUser, setDirectMessageUser] = useState<{
    userId: string;
    userName: string;
    userAvatar?: string;
  } | null>(null);

  const {
    selectedLocalClub,
    selectedTicket,
    localSupportTickets,
    isLoading,
    handleSelectClub,
    handleSelectTicket
  } = useChatDrawerState(open, supportTickets);

  const {
    supportMessage,
    setSupportMessage,
    selectedSupportOption,
    setSelectedSupportOption,
    handleSubmitSupportTicket,
    isSubmitting,
  } = useSupportTickets();
  
  // Create a wrapper function that calls handleSubmitSupportTicket but returns void
  const handleSubmitSupportTicketWrapper = async (): Promise<void> => {
    await handleSubmitSupportTicket();
    // Deliberately not returning anything to match the Promise<void> return type
  };
  
  useEffect(() => {
    const handleOpenDM = (event: CustomEvent<{
      userId: string;
      userName: string;
      userAvatar?: string;
    }>) => {
      setActiveTab("dm");
      setDirectMessageUser({
        userId: event.detail.userId,
        userName: event.detail.userName,
        userAvatar: event.detail.userAvatar
      });
    };

    window.addEventListener('openDirectMessage', handleOpenDM as EventListener);
    return () => {
      window.removeEventListener('openDirectMessage', handleOpenDM as EventListener);
    };
  }, []);

  return (
    <ChatProvider>
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="h-[80vh] rounded-t-xl p-0 flex flex-col">
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
            refreshKey={0}
            messages={clubMessages}
            deleteChat={() => {}}
            unreadMessages={{}}
            handleNewMessage={() => {}}
            markTicketAsRead={() => {}}
            onSendMessage={() => {}}
            directMessageUser={directMessageUser}
            setDirectMessageUser={setDirectMessageUser}
            supportMessage={supportMessage}
            setSupportMessage={setSupportMessage}
            selectedSupportOption={selectedSupportOption}
            setSelectedSupportOption={setSelectedSupportOption}
            handleSubmitSupportTicket={handleSubmitSupportTicketWrapper}
            isSubmitting={isSubmitting}
            isLoading={isLoading}
          />
        </DrawerContent>
      </Drawer>
    </ChatProvider>
  );
};

export default MainChatDrawer;
