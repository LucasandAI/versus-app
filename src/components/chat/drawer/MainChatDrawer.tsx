
import React, { useState } from 'react';
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

  const {
    selectedLocalClub,
    selectedTicket,
    handleSelectClub,
    handleSelectTicket,
  } = useChatDrawerState(open, supportTickets);

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
    if (!currentUser) return;

    try {
      const { data: ticketData, error: ticketError } = await supabase
        .from('support_tickets')
        .insert({
          subject: selectedSupportOption?.label,
          user_id: currentUser.id
        })
        .select()
        .single();

      if (ticketError || !ticketData) {
        throw new Error(ticketError?.message || 'Failed to create support ticket');
      }

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

      const { error: autoResponseError } = await supabase
        .from('support_messages')
        .insert({
          ticket_id: ticketData.id,
          sender_id: 'system',
          text: `Thank you for contacting support about "${selectedSupportOption?.label}". A support agent will review your request and respond shortly.`,
          is_support: true
        });

      if (autoResponseError) {
        console.error('Failed to create auto-response:', autoResponseError);
      }

      toast({
        title: "Support Ticket Created",
        description: "Your support request has been submitted successfully."
      });

      setSupportMessage("");
      setSelectedSupportOption(null);

      const event = new CustomEvent('supportTicketCreated', { 
        detail: { ticketId: ticketData.id }
      });
      window.dispatchEvent(event);
      
      setActiveTab("support");
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
                supportTickets={supportTickets}
                onSelectTicket={handleSelectTicket}
                handleSubmitSupportTicket={handleSubmitSupportTicket}
                supportMessage={supportMessage}
                setSupportMessage={setSupportMessage}
              />
            )}
          </div>
        </DrawerContent>
      </Drawer>
    </ChatProvider>
  );
};

export default MainChatDrawer;
