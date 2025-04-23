
import React, { useState, useEffect } from 'react';
import { Drawer, DrawerContent } from '@/components/ui/drawer';
import { ChatProvider } from '@/context/ChatContext';
import { Club } from '@/types';
import { SupportTicket } from '@/types/chat';
import { useChat } from '@/hooks/chat/useChat';
import { useChatDrawerState } from '@/hooks/chat/useChatDrawerState';
import { useChatMessages } from '@/hooks/chat/useChatMessages';
import ChatDrawerHeader from './ChatDrawerHeader';
import ChatDrawerContent from './ChatDrawerContent';
import DMSearchPanel from './dm/DMSearchPanel';
import SupportTabContent from './support/SupportTabContent';
import ChatDrawerTabs from './ChatDrawerTabs';
import { useApp } from '@/context/AppContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useChatDrawerGlobal } from '@/context/ChatDrawerContext';

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
  const { close: closeDrawer } = useChatDrawerGlobal();
  const [activeTab, setActiveTab] = useState<"clubs"|"dm"|"support">("clubs");
  const [supportMessage, setSupportMessage] = useState("");
  const [selectedSupportOption, setSelectedSupportOption] = useState<{id: string, label: string} | null>(null);
  const [localSupportTickets, setLocalSupportTickets] = useState<SupportTicket[]>(supportTickets);

  // Load tickets from storage when drawer opens
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

  const handleSubmitSupportTicket = async () => {
    if (!currentUser || !selectedSupportOption) {
      toast({
        title: "Error",
        description: "Please select a support topic and enter a message",
        variant: "destructive"
      });
      return;
    }
    
    if (!supportMessage.trim()) {
      toast({
        title: "Message Required",
        description: "Please provide details about your issue",
        variant: "destructive"
      });
      return;
    }

    try {
      // Create the ticket in Supabase
      const { data: ticketData, error: ticketError } = await supabase
        .from('support_tickets')
        .insert({
          subject: selectedSupportOption.label,
          user_id: currentUser.id
        })
        .select()
        .single();

      if (ticketError || !ticketData) {
        throw new Error(ticketError?.message || 'Failed to create support ticket');
      }

      // Add the initial message
      const { error: messageError } = await supabase
        .from('support_messages')
        .insert({
          ticket_id: ticketData.id,
          sender_id: currentUser.id,
          text: supportMessage,
          is_support: false
        });

      if (messageError) {
        throw new Error(messageError.message);
      }

      // Add auto-response
      const { error: autoResponseError } = await supabase
        .from('support_messages')
        .insert({
          ticket_id: ticketData.id,
          sender_id: 'system',
          text: `Thank you for contacting support about "${selectedSupportOption.label}". A support agent will review your request and respond shortly.`,
          is_support: true
        });

      if (autoResponseError) {
        console.error('Failed to create auto-response:', autoResponseError);
      }

      // Create a new ticket object for the UI
      const newTicket: SupportTicket = {
        id: ticketData.id,
        subject: selectedSupportOption.label,
        createdAt: new Date().toISOString(),
        messages: [
          {
            id: Date.now().toString(),
            text: supportMessage,
            sender: {
              id: currentUser.id,
              name: currentUser.name,
              avatar: currentUser.avatar || '/placeholder.svg'
            },
            timestamp: new Date().toISOString(),
            isSupport: false
          },
          {
            id: 'auto-' + Date.now(),
            text: `Thank you for contacting support about "${selectedSupportOption.label}". A support agent will review your request and respond shortly.`,
            sender: {
              id: 'system',
              name: 'Support Team',
              avatar: '/placeholder.svg'
            },
            timestamp: new Date(Date.now() + 1000).toISOString(),
            isSupport: true
          }
        ]
      };

      // Update local state and storage
      setLocalSupportTickets(prev => [newTicket, ...prev]);
      
      const existingTickets = localStorage.getItem('supportTickets');
      const storedTickets = existingTickets ? JSON.parse(existingTickets) : [];
      localStorage.setItem('supportTickets', JSON.stringify([newTicket, ...storedTickets]));

      // Notify the system
      window.dispatchEvent(new CustomEvent('supportTicketCreated', { 
        detail: { ticketId: ticketData.id }
      }));
      
      // Show success message and reset form
      toast({
        title: "Support Ticket Created",
        description: "Your support request has been submitted successfully."
      });
      
      setSupportMessage("");
      setSelectedSupportOption(null);
      
      // Select the newly created ticket
      handleSelectTicket(newTicket);
      
    } catch (error) {
      console.error('Error creating support ticket:', error);
      toast({
        title: "Error",
        description: "Failed to create support ticket. Please try again.",
        variant: "destructive"
      });
    }
  };

  return (
    <ChatProvider>
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="h-[80vh] rounded-t-xl p-0 flex flex-col">
          <ChatDrawerHeader />
          <ChatDrawerTabs activeTab={activeTab} setActiveTab={setActiveTab} />
          
          <div className="flex-1 overflow-auto">
            {activeTab === "clubs" && (
              <ChatDrawerContent 
                clubs={clubs}
                selectedLocalClub={selectedLocalClub}
                selectedTicket={null}
                localSupportTickets={[]}
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
                    const newMessage = {
                      id: `temp-${Date.now()}`,
                      text: message,
                      sender: {
                        id: currentUser.id,
                        name: currentUser.name,
                        avatar: currentUser.avatar || '/placeholder.svg'
                      },
                      timestamp: new Date().toISOString()
                    };
                    
                    handleNewMessage(clubId, newMessage, open);

                    await supabase.from('club_chat_messages').insert({
                      message,
                      club_id: clubId,
                      sender_id: currentUser.id
                    });
                  } catch (error) {
                    console.error('Error sending club message:', error);
                  }
                }}
              />
            )}
            {activeTab === "dm" && <DMSearchPanel />}
            {activeTab === "support" && (
              <SupportTabContent
                supportTickets={localSupportTickets}
                selectedTicket={selectedTicket}
                onSelectTicket={handleSelectTicket}
                handleSubmitSupportTicket={handleSubmitSupportTicket}
                supportMessage={supportMessage}
                setSupportMessage={setSupportMessage}
                onSendMessage={handleSendMessage}
              />
            )}
          </div>
        </DrawerContent>
      </Drawer>
    </ChatProvider>
  );
};

export default MainChatDrawer;
