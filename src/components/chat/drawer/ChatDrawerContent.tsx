
import React from 'react';
import { Club } from '@/types';
import { SupportTicket } from '@/types/chat';
import { useApp } from '@/context/AppContext';
import { useChat } from '@/hooks/useChat';
import ChatSidebar from '../ChatSidebar';
import ChatClubContent from '../ChatClubContent';
import ChatTicketContent from '../ChatTicketContent';
import ChatEmpty from '../ChatEmpty';

interface ChatDrawerContentProps {
  clubs: Club[];
  selectedLocalClub: Club | null;
  selectedTicket: SupportTicket | null;
  localSupportTickets: SupportTicket[];
  onSelectClub: (club: Club) => void;
  onSelectTicket: (ticket: SupportTicket) => void;
  refreshKey: number;
  messages: Record<string, any[]>;
  deleteChat: (chatId: string, isTicket: boolean) => void;
  unreadMessages: Record<string, number>;
  handleNewMessage: (clubId: string, message: any, isOpen: boolean) => void;
  markTicketAsRead: (ticketId: string) => void;
}

const ChatDrawerContent = ({
  clubs,
  selectedLocalClub,
  selectedTicket,
  localSupportTickets,
  onSelectClub,
  onSelectTicket,
  refreshKey,
  messages,
  deleteChat,
  unreadMessages,
  handleNewMessage,
  markTicketAsRead,
}: ChatDrawerContentProps) => {
  const { setCurrentView, setSelectedClub, setSelectedUser, currentUser } = useApp();

  const handleMatchClick = () => {
    if (!selectedLocalClub || !selectedLocalClub.currentMatch) return;
    setSelectedClub(selectedLocalClub);
    setCurrentView('clubDetail');
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
      
      handleNewMessage(selectedLocalClub.id, newMessage, true);
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
      
      onSelectTicket(updatedTicket);
      
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
        
        onSelectTicket(ticketWithResponse);
      }, 1000);
    }
  };

  return (
    <div className="flex h-full" key={refreshKey}>
      <ChatSidebar 
        clubs={currentUser?.clubs || []}
        selectedClub={selectedLocalClub}
        selectedTicket={selectedTicket}
        supportTickets={localSupportTickets}
        onSelectClub={onSelectClub}
        onSelectTicket={onSelectTicket}
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
  );
};

export default ChatDrawerContent;
