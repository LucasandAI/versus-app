
import React from 'react';
import { Club } from '@/types';
import ChatEmpty from '../ChatEmpty';
import ChatMainContent from './chat-content/ChatMainContent';

interface ChatDrawerContentProps {
  selectedClub: Club | null;
  messages: Record<string, any[]>;
  onMatchClick: (club: Club) => void;
  onSelectUser: (userId: string, userName: string, userAvatar?: string) => void;
  onSendMessage: (message: string, clubId?: string) => void;
  setClubMessages?: React.Dispatch<React.SetStateAction<Record<string, any[]>>>;
}

const ChatDrawerContent: React.FC<ChatDrawerContentProps> = ({
  selectedClub,
  messages,
  onMatchClick,
  onSelectUser,
  onSendMessage,
  setClubMessages,
}) => {
  console.log('[ChatDrawerContent] Rendering with:', { 
    hasSelectedClub: !!selectedClub, 
    clubId: selectedClub?.id
  });
  
  if (!selectedClub) {
    return <ChatEmpty />;
  }
  
  const clubMessages = selectedClub ? (messages[selectedClub.id] || []) : [];
  
  return (
    <div className="h-full flex flex-col">
      <ChatMainContent
        selectedClub={selectedClub}
        selectedTicket={null}
        messages={clubMessages}
        onMatchClick={onMatchClick}
        onSelectUser={onSelectUser}
        onSendMessage={onSendMessage}
        setClubMessages={setClubMessages}
      />
    </div>
  );
};

export default ChatDrawerContent;
