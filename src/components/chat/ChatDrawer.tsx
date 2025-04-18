import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerClose } from '@/components/ui/drawer';
import { Club } from '@/types';
import { SupportTicket } from '@/types/chat';
import { useApp } from '@/context/AppContext';
import { useChat } from '@/hooks/useChat';
import { toast } from '@/hooks/use-toast';
import { ChatProvider } from '@/context/ChatContext';
import ChatSidebar from './ChatSidebar';
import ChatClubContent from './ChatClubContent';
import ChatTicketContent from './ChatTicketContent';
import ChatEmpty from './ChatEmpty';

interface ChatDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clubs: Club[];
  onNewMessage?: (count: number) => void;
  supportTickets?: SupportTicket[];
}

const ChatDrawer = ({ 
  open, 
  onOpenChange, 
  clubs,
  onNewMessage,
  supportTickets: externalSupportTickets = []
}: ChatDrawerProps) => {
  const { setCurrentView, setSelectedClub, setSelectedUser, currentUser } = useApp();
  const [selectedLocalClub, setSelectedLocalClub] = useState<Club | null>(null);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [localSupportTickets, setLocalSupportTickets] = useState<SupportTicket[]>(externalSupportTickets);
  
  const { 
    messages, 
    unreadMessages, 
    refreshKey, 
    handleNewMessage,
    markTicketAsRead,
    deleteChat
  } = useChat(open, onNewMessage);

  useEffect(() => {
    if (open) {
      const storedTickets = localStorage.getItem('supportTickets');
      if (storedTickets) {
        try {
          const parsedTickets = JSON.parse(storedTickets);
          setLocalSupportTickets(parsedTickets);
        } catch (error) {
          console.error("Error parsing support tickets:", error);
        }
      }
    }
  }, [open, externalSupportTickets, refreshKey]);

  const handleSelectClub = (club: Club) => {
    setSelectedLocalClub(club);
    setSelectedTicket(null);
  };

  const handleSelectTicket = (ticket: SupportTicket) => {
    setSelectedTicket(ticket);
    setSelectedLocalClub(null);
    markTicketAsRead(ticket.id);
  };

  const handleMatchClick = () => {
    if (!selectedLocalClub || !selectedLocalClub.currentMatch) return;
    setSelectedClub(selectedLocalClub);
    setCurrentView('clubDetail');
    onOpenChange(false);
  };

  const handleSelectUser = (userId: string, userName: string, userAvatar: string = '/placeholder.svg') => {
    setSelectedUser({
      id: userId,
      name: userName,
      avatar: userAvatar,
      stravaConnected: true,
      clubs: []
    });
    setCurrentView('profile');
    onOpenChange(false);
  };

  const handleSendMessage = (message: string) => {
    if (selectedLocalClub && message.trim()) {
      const newMessage = {
        id: Date.now().toString(),
        text: message,
        sender: {
          id: currentUser?.id || 'anonymous',
          name: currentUser?.name || 'Anonymous',
          avatar: currentUser?.avatar || '/placeholder.svg',
        },
        timestamp: new Date().toISOString(),
      };
      
      handleNewMessage(selectedLocalClub.id, newMessage, open);
    } 
    else if (selectedTicket && message.trim()) {
      const newMessage = {
        id: Date.now().toString(),
        text: message,
        sender: {
          id: currentUser?.id || 'anonymous',
          name: currentUser?.name || 'Anonymous',
          avatar: currentUser?.avatar || '/placeholder.svg',
        },
        timestamp: new Date().toISOString(),
        isSupport: false
      };
      
      const updatedTicket = {
        ...selectedTicket,
        messages: [...selectedTicket.messages, newMessage]
      };
      
      setLocalSupportTickets(prev => 
        prev.map(ticket => 
          ticket.id === selectedTicket.id ? updatedTicket : ticket
        )
      );
      
      setSelectedTicket(updatedTicket);
      
      setTimeout(() => {
        const supportResponse = {
          id: 'support-' + Date.now() + '-response',
          text: "We've received your message. Our support team will get back to you as soon as possible.",
          sender: {
            id: 'support',
            name: 'Support Team',
            avatar: '/placeholder.svg'
          },
          timestamp: new Date().toISOString(),
          isSupport: true
        };
        
        const ticketWithResponse = {
          ...updatedTicket,
          messages: [...updatedTicket.messages, supportResponse]
        };
        
        setLocalSupportTickets(prev => 
          prev.map(ticket => 
            ticket.id === selectedTicket.id ? ticketWithResponse : ticket
          )
        );
        
        setSelectedTicket(ticketWithResponse);
        
        const storedTickets = localStorage.getItem('supportTickets');
        if (storedTickets) {
          const parsedTickets = JSON.parse(storedTickets);
          const updatedTickets = parsedTickets.map((ticket: SupportTicket) => 
            ticket.id === selectedTicket.id ? ticketWithResponse : ticket
          );
          localStorage.setItem('supportTickets', JSON.stringify(updatedTickets));
        }
      }, 1000);
    }
  };

  return (
    <ChatProvider>
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="h-[80vh] rounded-t-xl p-0">
          <DrawerHeader className="border-b px-4 py-3">
            <div className="flex items-center justify-between">
              <DrawerTitle>Chats</DrawerTitle>
              <DrawerClose className="p-1.5 rounded-full hover:bg-gray-100">
                <X className="h-4 w-4" />
              </DrawerClose>
            </div>
          </DrawerHeader>
          
          <div className="flex h-full" key={refreshKey}>
            <ChatSidebar 
              clubs={currentUser?.clubs || []}
              selectedClub={selectedLocalClub}
              selectedTicket={selectedTicket}
              supportTickets={localSupportTickets}
              onSelectClub={handleSelectClub}
              onSelectTicket={handleSelectTicket}
              onDeleteChat={deleteChat}
              unreadCounts={unreadMessages}
            />
            
            {selectedLocalClub && (
              <ChatClubContent 
                club={selectedLocalClub}
                messages={messages[selectedLocalClub.id] || []}
                onMatchClick={handleMatchClick}
                onSelectUser={handleSelectUser}
                onSendMessage={handleSendMessage}
              />
            )}

            {selectedTicket && (
              <ChatTicketContent 
                ticket={selectedTicket}
                onSendMessage={handleSendMessage}
              />
            )}
            
            {!selectedLocalClub && !selectedTicket && <ChatEmpty />}
          </div>
        </DrawerContent>
      </Drawer>
    </ChatProvider>
  );
};

export default ChatDrawer;
