
import React from 'react';
import { Club } from '@/types';
import { SupportTicket } from '@/types/chat';
import ChatClubContent from '../../ChatClubContent';
import ChatTicketContent from '../../ChatTicketContent';

interface ChatMainContentProps {
  selectedClub: Club | null;
  selectedTicket: SupportTicket | null;
  messages: Record<string, any[]>;
  onMatchClick: (club: Club) => void;
  onSelectUser: (userId: string, userName: string, userAvatar?: string) => void;
  onSendMessage: (message: string, clubId?: string) => void;
}

const ChatMainContent: React.FC<ChatMainContentProps> = ({
  selectedClub,
  selectedTicket,
  messages,
  onMatchClick,
  onSelectUser,
  onSendMessage,
}) => {
  if (selectedClub) {
    return (
      <ChatClubContent 
        club={selectedClub}
        messages={messages[selectedClub.id] || []}
        onMatchClick={() => onMatchClick(selectedClub)}
        onSelectUser={onSelectUser}
        onSendMessage={(message) => onSendMessage(message, selectedClub.id)}
      />
    );
  }

  if (selectedTicket) {
    return (
      <ChatTicketContent 
        ticket={selectedTicket}
        onSendMessage={onSendMessage}
      />
    );
  }

  return null;
};

export default ChatMainContent;
