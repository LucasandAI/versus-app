
import React, { useState } from 'react';
import { Drawer, DrawerContent } from '@/components/ui/drawer';
import { ChatProvider } from '@/context/ChatContext';
import { Club } from '@/types';
import { SupportTicket } from '@/types/chat';
import { useChat } from '@/hooks/chat/useChat';
import { useChatDrawerState } from '@/hooks/chat/useChatDrawerState';
import ChatDrawerHeader from './ChatDrawerHeader';
import ChatDrawerContent from './ChatDrawerContent';
import SupportOptions from './support/SupportOptions';
import NewTicketDialog from './support/NewTicketDialog';
import DMSearchPanel from './dm/DMSearchPanel';
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
  const [supportOptionsOpen, setSupportOptionsOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
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
    createSupportTicket
  } = useChat(open, onNewMessage);

  const handleOpenSupportOptions = () => {
    setSupportOptionsOpen(true);
  };

  const handleSelectSupportOption = (option: {id: string, label: string}) => {
    setSelectedSupportOption(option);
    setSupportOptionsOpen(false);
    setDialogOpen(true);
  };

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

      setDialogOpen(false);
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
          <nav className="flex border-b">
            {["clubs", "dm", "support"].map(tab => (
              <button
                key={tab}
                className={`flex-1 py-3 text-center text-sm font-medium transition ${
                  activeTab === tab 
                    ? "border-b-2 border-primary text-primary" 
                    : "text-gray-500 hover:text-primary"
                }`}
                onClick={() => setActiveTab(tab as any)}
                data-testid={`chat-tab-${tab}`}
              >
                {tab === "clubs" ? "Club Chat" : tab === "dm" ? "Direct Messages" : "Support"}
              </button>
            ))}
          </nav>
          
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
              <div className="p-4">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="font-semibold text-lg">Support Tickets</h2>
                  <button 
                    className="bg-primary text-white px-4 py-2 rounded-md text-sm"
                    onClick={handleOpenSupportOptions}
                  >
                    New Ticket
                  </button>
                </div>
                
                {supportTickets && supportTickets.length === 0 ? (
                  <div className="text-gray-500 text-sm py-4 text-center">
                    No support tickets yet. Click "New Ticket" to create one.
                  </div>
                ) : (
                  <ul className="space-y-2">
                    {supportTickets.map((ticket) => (
                      <li 
                        key={ticket.id} 
                        onClick={() => handleSelectTicket(ticket)}
                        className="p-3 border rounded-md cursor-pointer hover:bg-gray-50 transition"
                      >
                        <div className="font-medium">{ticket.subject}</div>
                        <div className="text-xs text-gray-500">
                          Created: {new Date(ticket.createdAt).toLocaleDateString()} 
                          • {ticket.messages.length} message{ticket.messages.length !== 1 ? 's' : ''}
                        </div>
                        <div className="text-xs text-blue-500 mt-1">Click to view conversation</div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        </DrawerContent>
      </Drawer>

      <SupportOptions 
        open={supportOptionsOpen}
        onOpenChange={setSupportOptionsOpen}
        onSelectOption={handleSelectSupportOption}
      />

      <NewTicketDialog 
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        selectedOption={selectedSupportOption}
        onSubmit={handleSubmitSupportTicket}
        supportMessage={supportMessage}
        setSupportMessage={setSupportMessage}
      />
    </ChatProvider>
  );
};

export default MainChatDrawer;
