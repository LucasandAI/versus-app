
import React from 'react';
import { Club } from '@/types';
import ChatSidebarContent from '../ChatSidebarContent';
import ChatClubContent from '../../../chat/ChatClubContent';

interface ChatClubContainerProps {
  clubs: Club[];
  selectedClub: Club | null;
  onSelectClub: (club: Club) => void;
  messages?: Record<string, any[]>;
  onSendMessage: (message: string, clubId?: string) => void;
  onDeleteMessage?: (messageId: string) => void;
}

const ChatClubContainer: React.FC<ChatClubContainerProps> = ({
  clubs,
  selectedClub,
  onSelectClub,
  messages = {},
  onSendMessage,
  onDeleteMessage
}) => {
  const handleMatchClick = () => {
    // Future implementation
  };

  const handleSelectUser = (userId: string, userName: string, userAvatar?: string) => {
    const event = new CustomEvent('openDirectMessage', {
      detail: { userId, userName, userAvatar }
    });
    window.dispatchEvent(event);
  };

  return (
    <div className="flex h-full">
      <div className="w-1/3 border-r">
        <ChatSidebarContent 
          clubs={clubs}
          selectedClub={selectedClub}
          onSelectClub={onSelectClub}
        />
      </div>
      
      <div className="w-2/3">
        {selectedClub ? (
          <ChatClubContent 
            club={selectedClub}
            messages={messages[selectedClub.id] || []}
            onMatchClick={handleMatchClick}
            onSelectUser={handleSelectUser}
            onSendMessage={onSendMessage}
            onDeleteMessage={onDeleteMessage}
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500">Select a club to start chatting</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatClubContainer;
