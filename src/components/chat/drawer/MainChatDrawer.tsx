
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

  const handleSendClubMessage = async (message: string, clubId: string) => {
    if (!currentUser || !message.trim()) return;
    
    try {
      const tempId = `temp-${Date.now()}`;
      const optimisticMessage = {
        id: tempId,
        text: message,
        sender: {
          id: currentUser.id,
          name: currentUser.name || 'You',
          avatar: currentUser.avatar || '/placeholder.svg'
        },
        timestamp: new Date().toISOString()
      };
      
      setLocalClubMessages(prev => {
        const updatedMessages = {
          ...prev,
          [clubId]: [...(prev[clubId] || []), optimisticMessage]
        };
        console.log("Updated local messages with optimistic update:", updatedMessages[clubId]);
        return updatedMessages;
      });

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
        
        setLocalClubMessages(prev => {
          const filteredMessages = (prev[clubId] || []).filter(msg => msg.id !== tempId);
          return {
            ...prev,
            [clubId]: filteredMessages
          };
        });
      } else {
        console.log("Message sent successfully:", data);
      }
    } catch (error) {
      console.error('Error sending club message:', error);
      toast({
        title: "Message Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    if (!open) return;

    console.log('Setting up real-time message deletion listener');
    
    // Create a channel specifically for message deletions
    const messageDeleteChannel = supabase.channel('club-message-deletions');
    
    messageDeleteChannel
      .on('postgres_changes', 
          { event: 'DELETE', schema: 'public', table: 'club_chat_messages' },
          (payload) => {
            console.log('Message deletion event received:', payload);
            
            if (payload.old && payload.old.id && payload.old.club_id) {
              const deletedMessageId = payload.old.id;
              const clubId = payload.old.club_id;
              
              console.log(`Removing message ${deletedMessageId} from club ${clubId}`);
              
              // Update the local state by removing the deleted message
              setLocalClubMessages(prev => {
                if (!prev[clubId]) return prev;
                
                const updatedClubMessages = prev[clubId].filter(msg => {
                  // Check for both id formats (string and direct object properties)
                  const msgId = typeof msg.id === 'string' ? msg.id : 
                               (msg.id ? String(msg.id) : null);
                  return msgId !== deletedMessageId;
                });
                
                console.log(`Updated messages count after deletion: ${updatedClubMessages.length}`);
                
                return {
                  ...prev,
                  [clubId]: updatedClubMessages
                };
              });
            }
          })
      .subscribe((status) => {
        console.log(`Subscription status for message deletions: ${status}`);
      });
      
    return () => {
      console.log('Removing real-time message deletion listener');
      supabase.removeChannel(messageDeleteChannel);
    };
  }, [open]);

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
            messages={localClubMessages || messages}
            deleteChat={deleteChat}
            unreadMessages={unreadMessages}
            handleNewMessage={handleNewMessage}
            markTicketAsRead={markTicketAsRead}
            onSendMessage={handleSendClubMessage}
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
