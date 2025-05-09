
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
  onDeleteMessage?: (messageId: string) => void;
  setClubMessages?: React.Dispatch<React.SetStateAction<Record<string, any[]>>>;
  loadOlderMessages?: (clubId: string) => Promise<void>;
  isLoading?: Record<string, boolean>;
  hasMore?: Record<string, boolean>;
}

const ChatDrawerContent: React.FC<ChatDrawerContentProps> = ({
  selectedClub,
  messages,
  onMatchClick,
  onSelectUser,
  onSendMessage,
  onDeleteMessage,
  setClubMessages,
  loadOlderMessages,
  isLoading,
  hasMore,
}) => {
  console.log('[ChatDrawerContent] Rendering with:', { 
    hasSelectedClub: !!selectedClub, 
    clubId: selectedClub?.id
  });
  
  if (!selectedClub) {
    return <ChatEmpty />;
  }
  
  return (
    <div className="h-full flex flex-col">
      <ChatMainContent
        selectedClub={selectedClub}
        selectedTicket={null}
        messages={messages}
        onMatchClick={onMatchClick}
        onSelectUser={onSelectUser}
        onSendMessage={onSendMessage}
        onDeleteMessage={onDeleteMessage}
        setClubMessages={setClubMessages}
        loadOlderMessages={loadOlderMessages}
        isLoading={isLoading}
        hasMore={hasMore}
      />
    </div>
  );
};

export default ChatDrawerContent;
