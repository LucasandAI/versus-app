
import React from 'react';
import { Club } from '@/types';
import ChatSidebarContent from '../ChatSidebarContent';
import ChatClubContent from '../../../chat/ChatClubContent';
import { ArrowLeft } from 'lucide-react';

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

  const handleGoBack = () => {
    onSelectClub(null);
  };

  // If no club is selected, show the clubs list
  if (!selectedClub) {
    return (
      <div className="flex flex-col h-full">
        <ChatSidebarContent 
          clubs={clubs}
          selectedClub={selectedClub}
          onSelectClub={onSelectClub}
          onSelectUser={handleSelectUser}
          activeTab="clubs"
        />
      </div>
    );
  }

  // If a club is selected, show the full-width chat
  return (
    <div className="flex flex-col h-full">
      <div className="border-b p-3 flex items-center">
        <button 
          onClick={handleGoBack}
          className="p-2 rounded-full hover:bg-gray-100 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex-1 flex justify-center">
          <h3 className="font-semibold">{selectedClub.name}</h3>
        </div>
        <div className="w-9"></div> {/* Spacer for alignment */}
      </div>
      
      <div className="flex-1">
        <ChatClubContent 
          club={selectedClub}
          messages={messages[selectedClub.id] || []}
          onMatchClick={handleMatchClick}
          onSelectUser={handleSelectUser}
          onSendMessage={onSendMessage}
          onDeleteMessage={onDeleteMessage}
        />
      </div>
    </div>
  );
};

export default ChatClubContainer;
