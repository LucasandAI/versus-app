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
import { supabase } from '@/integrations/supabase/client';

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
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [selectedUserName, setSelectedUserName] = useState<string>('');
  const [selectedUserAvatar, setSelectedUserAvatar] = useState<string>();

  const handleSelectUser = (userId: string, userName: string, userAvatar?: string) => {
    setSelectedUserId(userId);
    setSelectedUserName(userName);
    setSelectedUserAvatar(userAvatar);
  };

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

  const { 
    messages, 
    unreadMessages, 
    refreshKey, 
    handleNewMessage,
    markTicketAsRead,
    deleteChat,
  } = useChat(open, onNewMessage);

  const { clubMessages: localMessages, setClubMessages } = useClubMessages(clubs, open, onNewMessage);

  const handleSendClubMessage = async (message: string, clubId?: string) => {
    if (!clubId) return;
    return sendMessageToClub(message, clubId, setClubMessages);
  };

  const sendMessageToClub = async (message: string, clubId: string, setMessages: React.Dispatch<React.SetStateAction<Record<string, any[]>>>) => {
    if (!currentUser) return;
    
    try {
      const { data, error } = await supabase.from('club_chat_messages').insert({
        message,
        club_id: clubId,
        sender_id: currentUser.id
      });
      
      if (error) throw error;
      
      return data;
    } catch (error) {
      console.error('Error sending club message:', error);
      toast({
        title: "Message Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive"
      });
    }
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
  
  console.log('[MainChatDrawer] Rendering with active tab:', activeTab, 
    'selectedClub:', selectedLocalClub?.id,
    'messages count:', Object.keys(localMessages).length);
  
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
            messages={localMessages}
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
            selectedUserId={selectedUserId}
            selectedUserName={selectedUserName}
            selectedUserAvatar={selectedUserAvatar}
            onSelectUser={handleSelectUser}
          />
        </UIDrawerContent>
      </Drawer>
    </ChatProvider>
  );
};

export default MainChatDrawer;
