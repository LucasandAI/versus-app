
import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerClose } from '@/components/ui/drawer';
import { Club } from '@/types';
import { SupportTicket } from '@/types/chat';
import ChatSidebar from './ChatSidebar';
import ChatMessages from './ChatMessages';
import ChatInput from './ChatInput';
import ChatHeader from './ChatHeader';
import { useChat } from '@/hooks/useChat';
import { useApp } from '@/context/AppContext';
import { toast } from '@/hooks/use-toast';

interface ChatDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clubs: Club[];
  onNewMessage?: (count: number) => void;
  supportTickets?: SupportTicket[];
}

const ChatDrawer: React.FC<ChatDrawerProps> = ({ 
  open, 
  onOpenChange, 
  clubs,
  onNewMessage,
  supportTickets: externalSupportTickets = []
}) => {
  const { setCurrentView, setSelectedUser, setSelectedClub, currentUser } = useApp();
  const [selectedLocalClub, setSelectedLocalClub] = useState<Club | null>(null);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [localSupportTickets, setLocalSupportTickets] = useState<SupportTicket[]>(externalSupportTickets);
  
  const { 
    messages, 
    supportTickets, 
    unreadMessages, 
    refreshKey, 
    handleNewMessage,
    setUnreadMessages,
    markTicketAsRead,
    deleteChat
  } = useChat(open, onNewMessage);

  // Update local tickets when external tickets change or when the drawer opens
  useEffect(() => {
    if (open) {
      // Load the latest tickets from localStorage
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

  // Handle support ticket updates
  useEffect(() => {
    const handleSupportTicketCreated = () => {
      // Load the latest tickets when a new ticket is created
      const storedTickets = localStorage.getItem('supportTickets');
      if (storedTickets) {
        try {
          const parsedTickets = JSON.parse(storedTickets);
          setLocalSupportTickets(parsedTickets);
        } catch (error) {
          console.error("Error parsing support tickets:", error);
        }
      }
    };
    
    window.addEventListener('supportTicketCreated', handleSupportTicketCreated);
    window.addEventListener('notificationsUpdated', handleSupportTicketCreated);
    
    return () => {
      window.removeEventListener('supportTicketCreated', handleSupportTicketCreated);
      window.removeEventListener('notificationsUpdated', handleSupportTicketCreated);
    };
  }, []);

  // Notify when the drawer is opened/closed
  useEffect(() => {
    if (open) {
      // When drawer opens, mark messages as read for the selected conversation
      if (selectedLocalClub) {
        markClubMessagesAsRead(selectedLocalClub.id);
      }
      if (selectedTicket) {
        markTicketAsRead(selectedTicket.id);
      }
    } else {
      // When drawer closes, dispatch event to notify other components
      const event = new CustomEvent('chatDrawerClosed');
      window.dispatchEvent(event);
      
      // Save read status to localStorage when drawer is closed
      localStorage.setItem('unreadMessages', JSON.stringify(unreadMessages));
    }
  }, [open, selectedLocalClub, selectedTicket, markTicketAsRead, unreadMessages]);

  const markClubMessagesAsRead = (clubId: string) => {
    setUnreadMessages(prev => {
      const updated = { ...prev, [clubId]: 0 };
      localStorage.setItem('unreadMessages', JSON.stringify(updated));
      return updated;
    });
  };

  const handleSelectClub = (club: Club) => {
    setSelectedLocalClub(club);
    setSelectedTicket(null);
    
    // Mark the club messages as read
    markClubMessagesAsRead(club.id);
    
    // Dispatch event to notify that unread counts may have changed
    const event = new CustomEvent('unreadMessagesUpdated');
    window.dispatchEvent(event);
  };

  const handleSelectTicket = (ticket: SupportTicket) => {
    setSelectedTicket(ticket);
    setSelectedLocalClub(null);
    
    // Mark the ticket as read and persist to localStorage
    markTicketAsRead(ticket.id);
    
    // Dispatch event to notify that unread counts may have changed
    const event = new CustomEvent('unreadMessagesUpdated');
    window.dispatchEvent(event);
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

  const handleMatchClick = () => {
    if (!selectedLocalClub || !selectedLocalClub.currentMatch) return;
    setSelectedClub(selectedLocalClub);
    setCurrentView('clubDetail');
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
      // Handle support ticket messages
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
      
      // Add message to existing ticket
      const updatedTicket = {
        ...selectedTicket,
        messages: [...selectedTicket.messages, newMessage]
      };
      
      // Update the local tickets state
      setLocalSupportTickets(prev => 
        prev.map(ticket => 
          ticket.id === selectedTicket.id ? updatedTicket : ticket
        )
      );
      
      // Update selected ticket
      setSelectedTicket(updatedTicket);
      
      // Add auto-response from support after a small delay
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
        
        // Update selected ticket with response
        setSelectedTicket(ticketWithResponse);
        
        // Update in localStorage
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

  const handleDeleteChat = (chatId: string, isTicket: boolean) => {
    // Clear selection if the deleted chat was selected
    if ((isTicket && selectedTicket?.id === chatId) || 
        (!isTicket && selectedLocalClub?.id === chatId)) {
      setSelectedTicket(null);
      setSelectedLocalClub(null);
    }
    
    // Delete the chat
    deleteChat(chatId, isTicket);
    
    // Update local state if it's a ticket
    if (isTicket) {
      setLocalSupportTickets(prev => prev.filter(ticket => ticket.id !== chatId));
    }
    
    toast({
      title: "Chat Deleted",
      description: "The conversation has been removed."
    });
  };

  return (
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
            onDeleteChat={handleDeleteChat}
            unreadCounts={unreadMessages}
          />
          
          {selectedLocalClub && (
            <div className="flex-1 flex flex-col h-full">
              <ChatHeader 
                club={selectedLocalClub}
                onMatchClick={handleMatchClick}
                onSelectUser={handleSelectUser}
              />
              
              <ChatMessages 
                messages={messages[selectedLocalClub.id] || []} 
                clubMembers={selectedLocalClub.members}
              />
              
              <ChatInput onSendMessage={handleSendMessage} />
            </div>
          )}

          {selectedTicket && (
            <div className="flex-1 flex flex-col h-full">
              <div className="border-b p-3">
                <h3 className="font-medium">{selectedTicket.subject}</h3>
                <p className="text-xs text-gray-500">
                  Created {new Date(selectedTicket.createdAt).toLocaleDateString()}
                </p>
              </div>
              
              <ChatMessages 
                messages={selectedTicket.messages || []} 
                clubMembers={currentUser ? [currentUser] : []}
                isSupport={true}
              />
              
              <ChatInput onSendMessage={handleSendMessage} />
            </div>
          )}
          
          {!selectedLocalClub && !selectedTicket && (
            <div className="flex-1 flex items-center justify-center text-gray-500">
              Select a club or support ticket to start chatting
            </div>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
};

export default ChatDrawer;
