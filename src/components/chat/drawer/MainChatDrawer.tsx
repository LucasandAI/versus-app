
import React, { useState, useEffect } from 'react';
import { Drawer, DrawerContent } from '@/components/ui/drawer';
import { ChatProvider } from '@/context/ChatContext';
import { Club } from '@/types';
import { SupportTicket } from '@/types/chat';
import { useChat } from '@/hooks/chat/useChat';
import { useChatDrawerState } from '@/hooks/chat/useChatDrawerState';
import { useChatMessages } from '@/hooks/chat/useChatMessages';
import { useSupportTickets } from '@/hooks/chat/useSupportTickets';
import DrawerHeader from './DrawerHeader';
import DrawerContentComponent from './DrawerContent';
import { useApp } from '@/context/AppContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

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
  } = useChat(open, onNewMessage);

  const { handleSendMessage } = useChatMessages(
    selectedTicket,
    handleSelectTicket,
    handleNewMessage,
    currentUser
  );

  useEffect(() => {
    const loadStoredTickets = () => {
      try {
        const storedTickets = localStorage.getItem('supportTickets');
        if (storedTickets) {
          const parsedTickets = JSON.parse(storedTickets);
          setLocalSupportTickets(parsedTickets);
        }
      } catch (error) {
        console.error("Error parsing support tickets:", error);
      }
    };
    
    if (open) {
      loadStoredTickets();
    }
    
    const handleTicketUpdated = () => loadStoredTickets();
    window.addEventListener('supportTicketCreated', handleTicketUpdated);
    window.addEventListener('notificationsUpdated', handleTicketUpdated);
    
    return () => {
      window.removeEventListener('supportTicketCreated', handleTicketUpdated);
      window.removeEventListener('notificationsUpdated', handleTicketUpdated);
    };
  }, [open]);

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

  return (
    <ChatProvider>
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="h-[80vh] rounded-t-xl p-0 flex flex-col">
          <DrawerHeader 
            activeTab={activeTab} 
            setActiveTab={setActiveTab} 
          />
          
          <DrawerContentComponent 
            activeTab={activeTab}
            clubs={clubs}
            selectedLocalClub={selectedLocalClub}
            selectedTicket={selectedTicket}
            localSupportTickets={localSupportTickets}
            onSelectClub={handleSelectClub}
            onSelectTicket={handleSelectTicket}
            refreshKey={refreshKey}
            messages={clubMessages || messages}
            deleteChat={deleteChat}
            unreadMessages={unreadMessages}
            handleNewMessage={handleNewMessage}
            markTicketAsRead={markTicketAsRead}
            onSendMessage={async (message: string, clubId: string) => {
              if (!currentUser) return;
              try {
                // First add optimistic message to UI
                const tempId = `temp-${Date.now()}`;
                const optimisticMessage = {
                  id: tempId,
                  text: message,
                  sender: {
                    id: currentUser.id,
                    name: currentUser.name,
                    avatar: currentUser.avatar || '/placeholder.svg'
                  },
                  timestamp: new Date().toISOString()
                };
                
                handleNewMessage(clubId, optimisticMessage, open);

                // Then save to database
                const { data, error } = await supabase.from('club_chat_messages').insert({
                  message,
                  club_id: clubId,
                  sender_id: currentUser.id
                }).select();

                if (error) {
                  console.error('Error sending club message:', error);
                  toast({
                    title: "Message Error",
                    description: "Failed to send message. Please try again.",
                    variant: "destructive"
                  });
                }
              } catch (error) {
                console.error('Error sending club message:', error);
                toast({
                  title: "Message Error",
                  description: "Failed to send message. Please try again.",
                  variant: "destructive"
                });
              }
            }}
            supportMessage={supportMessage}
            setSupportMessage={setSupportMessage}
            handleSubmitSupportTicket={handleSubmitTicket}
            isSubmitting={isSubmitting}
          />
        </DrawerContent>
      </Drawer>
    </ChatProvider>
  );
};

export default MainChatDrawer;
