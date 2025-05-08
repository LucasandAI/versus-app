
import React from 'react';
import { Club } from '@/types';
import ChatClubContent from '../../ChatClubContent';

interface ChatMainContentProps {
  selectedClub: Club | null;
  selectedTicket: any;
  messages: Record<string, any[]>;
  onMatchClick: (club: Club) => void;
  onSelectUser: (userId: string, userName: string, userAvatar?: string) => void;
  onSendMessage: (message: string, clubId?: string) => void;
  setClubMessages?: React.Dispatch<React.SetStateAction<Record<string, any[]>>>;
}

const ChatMainContent: React.FC<ChatMainContentProps> = ({
  selectedClub,
  selectedTicket,
  messages,
  onMatchClick,
  onSelectUser,
  onSendMessage,
  setClubMessages
}) => {
  if (selectedClub) {
    const clubMessages = messages[selectedClub.id] || [];
    
    return (
      <ChatClubContent 
        club={selectedClub}
        onMatchClick={() => onMatchClick(selectedClub)}
        onSelectUser={onSelectUser}
        onSendMessage={onSendMessage}
      />
    );
  }
  
  return null;
};

export default ChatMainContent;
