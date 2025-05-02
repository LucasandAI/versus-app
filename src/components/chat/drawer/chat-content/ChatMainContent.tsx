
import React, { useEffect } from 'react';
import { Club } from '@/types';
import ChatClubContent from '../../ChatClubContent';

interface ChatMainContentProps {
  selectedClub: Club | null;
  selectedTicket: null;
  messages: Record<string, any[]>;
  onMatchClick: (club: Club) => void;
  onSelectUser: (userId: string, userName: string, userAvatar?: string) => void;
  onSendMessage: (message: string, clubId?: string) => void;
  setClubMessages?: React.Dispatch<React.SetStateAction<Record<string, any[]>>>;
}

const ChatMainContent: React.FC<ChatMainContentProps> = ({
  selectedClub,
  onMatchClick,
  onSelectUser,
  onSendMessage,
}) => {
  // Enhanced debugging for component renders and selections
  useEffect(() => {
    console.log('[ChatMainContent] Rendering with:', {
      hasSelectedClub: !!selectedClub,
      clubId: selectedClub?.id
    });
  }, [selectedClub]);

  // If we have a selected club, render the club content
  if (selectedClub) {
    return (
      <div className="flex-1 h-full flex flex-col">
        <ChatClubContent 
          key={selectedClub.id} // Force re-render when club changes
          club={selectedClub}
          onMatchClick={() => onMatchClick(selectedClub)}
          onSelectUser={onSelectUser}
          clubId={selectedClub.id} // Pass clubId for proper context in ChatInput
        />
      </div>
    );
  }

  // If nothing is selected, show an empty state
  return (
    <div className="flex items-center justify-center h-full text-gray-500">
      {selectedClub ? 'Loading chat...' : 'Select a club to start chatting'}
    </div>
  );
};

export default ChatMainContent;
