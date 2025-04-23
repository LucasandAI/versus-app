
import React from 'react';
import { Club } from '@/types';
import ChatEmpty from '../ChatEmpty';
import ChatMainContent from './chat-content/ChatMainContent';

interface ChatDrawerContentProps {
  selectedClub: Club | null;
  selectedTicket: any | null;
  messages: Record<string, any[]>;
  onMatchClick: (club: Club) => void;
  onSelectUser: (userId: string, userName: string, userAvatar?: string) => void;
  onSendMessage: (message: string, clubId?: string) => void;
}

const ChatDrawerContent: React.FC<ChatDrawerContentProps> = ({
  selectedClub,
  selectedTicket,
  messages,
  onMatchClick,
  onSelectUser,
  onSendMessage,
}) => {
  if (!selectedClub && !selectedTicket) {
    return <ChatEmpty />;
  }
  
  return (
    <ChatMainContent
      selectedClub={selectedClub}
      selectedTicket={selectedTicket}
      messages={messages}
      onMatchClick={onMatchClick}
      onSelectUser={onSelectUser}
      onSendMessage={onSendMessage}
    />
  );
};

export default ChatDrawerContent;
