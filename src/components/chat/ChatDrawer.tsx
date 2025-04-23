
import React, { useState, useEffect } from 'react';
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
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from '@/hooks/use-toast';
import { useChatDrawerGlobal } from '@/context/ChatDrawerContext';

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

// Support ticket option types
const SUPPORT_OPTIONS = [
  { id: 'bug', label: 'Report a Bug' },
  { id: 'help', label: 'Ask for Help' },
  { id: 'cheating', label: 'Report Cheating' }
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
  const { close: closeDrawer } = useChatDrawerGlobal();
  const [activeTab, setActiveTab] = useState<"clubs"|"dm"|"support">("clubs");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [supportMessage, setSupportMessage] = useState("");
  const [selectedSupportOption, setSelectedSupportOption] = useState<{id: string, label: string} | null>(null);
  const [supportOptionsOpen, setSupportOptionsOpen] = useState(false);
  
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
    deleteChat,
    createSupportTicket
  } = useChat(open, onNewMessage);

  // Clear unread messages when drawer opens
  useEffect(() => {
    if (open) {
      // Reset unread messages when drawer is opened
      const updatedUnread = {...unreadMessages};
      let changed = false;
      
      Object.keys(updatedUnread).forEach(key => {
        if (updatedUnread[key] > 0) {
          updatedUnread[key] = 0;
          changed = true;
        }
      });
      
      if (changed) {
        // Save to localStorage
        localStorage.setItem('unreadMessages', JSON.stringify(updatedUnread));
        
        // Dispatch event to update other components
        const event = new CustomEvent('unreadMessagesUpdated');
        window.dispatchEvent(event);
        
        // Update UI if callback exists
        if (onNewMessage) {
          onNewMessage(0);
        }
      }
    }
  }, [open, unreadMessages, onNewMessage]);

  // Handler for sending group message
  const handleSendClubMessage = async (message: string, clubId: string) => {
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
      
      // Update local state immediately for real-time appearance
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

  const handleOpenSupportOptions = () => {
    setSupportOptionsOpen(true);
  };

  const handleSelectSupportOption = (option: {id: string, label: string}) => {
    setSelectedSupportOption(option);
    setSupportOptionsOpen(false);
    setDialogOpen(true);
  };

  const handleSubmitSupportTicket = async () => {
    if (!supportMessage.trim() || !selectedSupportOption || !currentUser) {
      toast({
        title: "Message Required",
        description: "Please provide details before submitting.",
        variant: "destructive"
      });
      return;
    }

    try {
      // Create ticket in Supabase
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

      // Add the first message to the ticket
      const { error: messageError } = await supabase
        .from('support_messages')
        .insert({
          ticket_id: ticketData.id,
          sender_id: currentUser.id,
          text: supportMessage,
          is_support: false
        });

      if (messageError) {
        throw new Error(messageError.message || 'Failed to create support message');
      }

      // Add automated response
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

      toast({
        title: "Support Ticket Created",
        description: "Your support request has been submitted successfully."
      });

      // Close the dialog first
      setDialogOpen(false);
      
      // Reset form
      setSupportMessage("");
      setSelectedSupportOption(null);

      // Refresh to show the new ticket
      const event = new CustomEvent('supportTicketCreated', { 
        detail: { ticketId: ticketData.id }
      });
      window.dispatchEvent(event);
      
      // Switch to support tab
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

  // Function to handle support ticket selection
  const handleSendSupportMessage = async (message: string) => {
    if (!currentUser || !selectedTicket) return;
    
    try {
      // Add message to Supabase
      const { error } = await supabase
        .from('support_messages')
        .insert({
          ticket_id: selectedTicket.id,
          sender_id: currentUser.id,
          text: message,
          is_support: false
        });
        
      if (error) {
        throw error;
      }
      
      // We don't need to update local state as the realtime subscription will handle that
      // This ensures consistency between what's in the DB and what's shown to the user
      
    } catch (error) {
      console.error('Error sending support message:', error);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
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
                selectedTicket={null}
                localSupportTickets={[]} // Don't show support tickets in club chat tab
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
              <SupportPanel 
                tickets={supportTickets} 
                selectedTicket={selectedTicket}
                onSelectTicket={handleSelectTicket}
                onCreateSupportTicket={handleOpenSupportOptions}
                onSendMessage={handleSendSupportMessage}
              />
            )}
          </div>
        </DrawerContent>
      </Drawer>

      {/* Support Options Dialog */}
      <AlertDialog open={supportOptionsOpen} onOpenChange={setSupportOptionsOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Select Support Type</AlertDialogTitle>
            <AlertDialogDescription>
              Please select the type of support you need:
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="grid gap-4 py-4">
            {SUPPORT_OPTIONS.map(option => (
              <Button 
                key={option.id}
                variant="outline" 
                className="justify-start text-left font-normal"
                onClick={() => handleSelectSupportOption(option)}
              >
                {option.label}
              </Button>
            ))}
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Support Ticket Dialog */}
      <AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {selectedSupportOption?.label || "Create Support Ticket"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              Please provide details about your issue.
              Our team will review your submission and respond in the support chat.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="grid gap-4 py-4">
            <textarea 
              className="w-full min-h-[100px] p-2 border rounded-md" 
              placeholder="Describe your issue in detail..."
              value={supportMessage}
              onChange={(e) => setSupportMessage(e.target.value)}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSupportMessage('')}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleSubmitSupportTicket}>Submit</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
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
const SupportPanel: React.FC<{ 
  tickets: SupportTicket[]; 
  selectedTicket: SupportTicket | null;
  onSelectTicket: (ticket: SupportTicket) => void;
  onCreateSupportTicket: () => void;
  onSendMessage: (message: string) => void;
}> = ({ tickets, selectedTicket, onSelectTicket, onCreateSupportTicket, onSendMessage }) => {
  if (selectedTicket) {
    return (
      <div className="h-full flex flex-col">
        <div className="border-b p-3">
          <h3 className="font-medium">{selectedTicket.subject}</h3>
          <p className="text-xs text-gray-500">
            Created {new Date(selectedTicket.createdAt).toLocaleDateString()}
          </p>
          <button
            onClick={() => onSelectTicket(null as unknown as SupportTicket)}
            className="text-xs text-blue-500 mt-1"
          >
            « Back to tickets
          </button>
        </div>
        
        <div className="flex-1 overflow-auto p-4 space-y-4">
          {selectedTicket.messages.map((msg) => (
            <div 
              key={msg.id}
              className={`flex ${msg.sender.id === 'support' || msg.isSupport ? 'justify-start' : 'justify-end'}`}
            >
              {(msg.sender.id === 'support' || msg.isSupport) && (
                <div className="bg-blue-100 text-blue-800 h-8 w-8 rounded-full flex items-center justify-center mr-2">
                  S
                </div>
              )}
              
              <div className={`max-w-[70%]`}>
                <div 
                  className={`rounded-lg p-3 text-sm break-words ${
                    msg.sender.id === 'support' || msg.isSupport
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-primary text-white'
                  }`}
                >
                  {msg.text}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          ))}
        </div>
        
        <div className="p-3 border-t">
          <div className="flex">
            <input 
              className="flex-1 border rounded-l-md px-3 py-2 focus:outline-none"
              placeholder="Type your message..."
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  const input = e.target as HTMLInputElement;
                  if (input.value.trim()) {
                    onSendMessage(input.value);
                    input.value = '';
                  }
                }
              }}
            />
            <button 
              className="bg-primary text-white px-4 py-2 rounded-r-md"
              onClick={(e) => {
                const input = e.currentTarget.previousSibling as HTMLInputElement;
                if (input.value.trim()) {
                  onSendMessage(input.value);
                  input.value = '';
                }
              }}
            >
              Send
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 overflow-auto h-full">
      <div className="flex justify-between items-center mb-4">
        <h2 className="font-semibold text-lg">Support Tickets</h2>
        <Button 
          size="sm" 
          className="flex items-center gap-1" 
          onClick={onCreateSupportTicket}
        >
          New Ticket
        </Button>
      </div>
      
      {tickets && tickets.length === 0 ? (
        <div className="text-gray-500 text-sm py-4 text-center">
          No support tickets yet. Click "New Ticket" to create one.
        </div>
      ) : (
        <ul className="space-y-2">
          {tickets.map((ticket) => (
            <li 
              key={ticket.id} 
              onClick={() => onSelectTicket(ticket)}
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
  );
};

export default ChatDrawer;
