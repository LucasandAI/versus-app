
import React, { useState } from 'react';
import { Drawer, DrawerContent } from '@/components/ui/drawer';
import { ChatProvider } from '@/context/ChatContext';
import { Club } from '@/types';
import { SupportTicket } from '@/types/chat';
import { useChat } from '@/hooks/chat/useChat';
import { useChatDrawerState } from '@/hooks/chat/useChatDrawerState';
import ChatDrawerHeader from './drawer/ChatDrawerHeader';
import ChatDrawerContent from './drawer/ChatDrawerContent';
import { supabase } from '@/integrations/supabase/client';
import { useApp } from '@/context/AppContext';

interface ChatDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clubs: Club[];
  onNewMessage?: (count: number) => void;
  supportTickets?: SupportTicket[];
  clubMessages?: Record<string, any[]>;
}

const TABS = [
  { key: "clubs", label: "Club Chat" },
  { key: "dm", label: "Direct Messages" },
  { key: "support", label: "Support" },
];

const ChatDrawer = ({ 
  open, 
  onOpenChange, 
  clubs,
  onNewMessage,
  supportTickets = [],
  clubMessages = {}
}: ChatDrawerProps) => {
  const { currentUser } = useApp();
  const [activeTab, setActiveTab] = useState<"clubs"|"dm"|"support">("clubs");
  const {
    selectedLocalClub,
    selectedTicket,
    localSupportTickets,
    handleSelectClub,
    handleSelectTicket,
  } = useChatDrawerState(open, supportTickets);

  const { 
    messages, 
    unreadMessages, 
    refreshKey, 
    handleNewMessage,
    markTicketAsRead,
    deleteChat
  } = useChat(open, onNewMessage);

  // Handler for sending group message
  const handleSendClubMessage = async (message: string, clubId: string) => {
    if (!currentUser) return;
    try {
      const newMessage = {
        id: `temp-${Date.now()}`,
        text: message,
        sender_id: currentUser.id,
        club_id: clubId,
        timestamp: new Date().toISOString(),
        sender: {
          id: currentUser.id,
          name: currentUser.name,
          avatar: currentUser.avatar || '/placeholder.svg'
        }
      };
      handleNewMessage(clubId, newMessage, open);

      // Persist to Supabase
      await supabase.from('club_chat_messages').insert({
        message,
        club_id: clubId,
        sender_id: currentUser.id
      });
    } catch (error) {
      console.error('Error in handleSendClubMessage:', error);
    }
  };

  return (
    <ChatProvider>
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="h-[80vh] rounded-t-xl p-0 flex flex-col">
          <ChatDrawerHeader />
          <nav className="flex border-b">
            {TABS.map(tab => (
              <button
                key={tab.key}
                className={`flex-1 py-3 text-center text-sm font-medium transition ${activeTab === tab.key ? "border-b-2 border-primary text-primary" : "text-gray-500 hover:text-primary"}`}
                onClick={() => setActiveTab(tab.key as any)}
                data-testid={`chat-tab-${tab.key}`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
          <div className="flex-1 overflow-auto">
            {activeTab === "clubs" && (
              <ChatDrawerContent 
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
                onSendMessage={handleSendClubMessage}
              />
            )}
            {activeTab === "dm" && (
              <DmSearchPanel />
            )}
            {activeTab === "support" && (
              <SupportPanel tickets={supportTickets} />
            )}
          </div>
        </DrawerContent>
      </Drawer>
    </ChatProvider>
  );
};

// --- DM Search (Stub): allow searching for users; real logic = todo, no mock data
const DmSearchPanel = () => {
  const [query, setQuery] = React.useState("");
  // TODO: Add real search, no mock data!
  return (
    <div className="p-4">
      <input
        className="w-full border rounded px-2 py-2 mb-2"
        type="text"
        placeholder="Search users to DM..."
        value={query}
        onChange={e => setQuery(e.target.value)}
      />
      {/* Display search results once implemented */}
      <p className="text-gray-500 text-sm">Type to search. (Feature Coming Soon)</p>
    </div>
  );
};

// --- Support Tickets Panel inside drawer
const SupportPanel: React.FC<{ tickets: SupportTicket[] }> = ({ tickets }) => (
  <div className="p-4 overflow-auto h-full">
    <h2 className="font-semibold mb-2 text-lg">Support Tickets</h2>
    <ul>
      {tickets && tickets.length === 0 ? (
        <li className="text-gray-500 text-sm">No support tickets yet.</li>
      ) : (
        tickets.map((ticket) => (
          <li key={ticket.id} className="mb-4 pb-2 border-b last:border-none">
            <strong>{ticket.subject}</strong>
            <div className="text-xs text-gray-500">ID: {ticket.id}</div>
            <ul className="mt-2 space-y-1">
              {ticket.messages.map((msg) => (
                <li key={msg.id} className="bg-gray-50 rounded p-2">
                  <span className="font-semibold text-xs">{msg.sender.name}:</span>{" "}
                  <span>{msg.text}</span>
                  <span className="block text-[11px] text-muted-foreground">{msg.timestamp}</span>
                </li>
              ))}
            </ul>
          </li>
        ))
      )}
    </ul>
    {/* Submit support ticket button could go here */}
  </div>
);

export default ChatDrawer;
