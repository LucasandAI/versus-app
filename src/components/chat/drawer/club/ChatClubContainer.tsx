
import React from 'react';
import { Club } from '@/types';
import ChatSidebarContent from '../ChatSidebarContent';
import ChatDrawerContent from '../ChatDrawerContent';

interface ChatClubContainerProps {
  clubs: Club[];
  selectedClub: Club | null;
  onSelectClub: (club: Club) => void;
  messages: Record<string, any[]>;
  unreadClubs: Set<string>;
  onSendMessage: (message: string, clubId?: string) => void;
  onDeleteMessage?: (messageId: string) => void;
  loadOlderMessages?: (clubId: string) => Promise<void>;
  isLoading?: Record<string, boolean>;
  hasMore?: Record<string, boolean>;
}

const ChatClubContainer: React.FC<ChatClubContainerProps> = ({
  clubs,
  selectedClub,
  onSelectClub,
  messages,
  unreadClubs,
  onSendMessage,
  onDeleteMessage,
  loadOlderMessages,
  isLoading,
  hasMore
}) => {
  const handleSelectUser = (userId: string, userName: string, userAvatar?: string) => {
    // Dispatch event to open DM with selected user
    const openDmEvent = new CustomEvent('openDirectMessage', {
      detail: {
        userId,
        userName,
        userAvatar,
        conversationId: undefined // Will be determined by the DM handler
      }
    });
    
    window.dispatchEvent(openDmEvent);
  };
  
  if (clubs.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-500">Join a club to chat</p>
      </div>
    );
  }

  return (
    <div className="flex h-full">
      <div className="w-1/4 border-r">
        <ChatSidebarContent 
          clubs={clubs}
          selectedClub={selectedClub}
          onSelectClub={onSelectClub}
          unreadClubs={unreadClubs}
        />
      </div>
      <div className="w-3/4">
        <ChatDrawerContent 
          selectedClub={selectedClub}
          messages={messages}
          onMatchClick={(club: Club) => {}}
          onSelectUser={handleSelectUser}
          onSendMessage={onSendMessage}
          onDeleteMessage={onDeleteMessage}
          loadOlderMessages={loadOlderMessages}
          isLoading={isLoading}
          hasMore={hasMore}
        />
      </div>
    </div>
  );
};

export default ChatClubContainer;
