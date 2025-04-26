
import React from 'react';
import { Club } from '@/types';
import { SupportTicket } from '@/types/chat';
import ChatEmpty from '../ChatEmpty';
import ChatMainContent from './chat-content/ChatMainContent';

interface ChatDrawerContentProps {
  selectedClub: Club | null;
  selectedTicket: SupportTicket | null;
  messages: Record<string, any[]>;
  onMatchClick: (club: Club) => void;
  onSelectUser: (userId: string, userName: string, userAvatar?: string) => void;
  onSendMessage: (message: string, clubId?: string) => void;
  setClubMessages?: React.Dispatch<React.SetStateAction<Record<string, any[]>>>;
}

const ChatDrawerContent: React.FC<ChatDrawerContentProps> = ({
  selectedClub,
  selectedTicket,
  messages,
  onMatchClick,
  onSelectUser,
  onSendMessage,
  setClubMessages,
}) => {
  console.log('[ChatDrawerContent] Rendering with:', { 
    hasSelectedClub: !!selectedClub, 
    hasSelectedTicket: !!selectedTicket,
    clubId: selectedClub?.id,
    ticketId: selectedTicket?.id
  });
  
  if (!selectedClub && !selectedTicket) {
    return <ChatEmpty />;
  }
  
  return (
    <div className="h-full flex flex-col">
      <ChatMainContent
        selectedClub={selectedClub}
        selectedTicket={selectedTicket}
        messages={messages}
        onMatchClick={onMatchClick}
        onSelectUser={onSelectUser}
        onSendMessage={onSendMessage}
        setClubMessages={setClubMessages}
      />
    </div>
  );
};

export default ChatDrawerContent;
