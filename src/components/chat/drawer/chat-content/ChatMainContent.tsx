
import React, { useEffect, useCallback, useMemo } from 'react';
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
  messages,
  onMatchClick,
  onSelectUser,
  onSendMessage,
  setClubMessages,
}) => {
  // Enhanced debugging for component renders and selections
  useEffect(() => {
    console.log('[ChatMainContent] Rendering with:', {
      hasSelectedClub: !!selectedClub,
      clubId: selectedClub?.id
    });
  }, [selectedClub]);

  // Memoize the send message handler to prevent unnecessary re-renders
  const handleSendMessage = useCallback((message: string) => {
    if (!selectedClub) return;
    
    console.log('[ChatMainContent] Sending club message to:', { 
      clubId: selectedClub.id, 
      messageLength: message.length 
    });
    onSendMessage(message, selectedClub.id);
  }, [selectedClub, onSendMessage]);
  
  // Memoize matchClick handler
  const handleMatchClick = useCallback(() => {
    if (!selectedClub) return;
    onMatchClick(selectedClub);
  }, [selectedClub, onMatchClick]);

  // If we have a selected club, render the club content
  if (selectedClub) {
    const clubMessages = messages[selectedClub.id] || [];
    console.log('[ChatMainContent] Rendering club messages:', { 
      clubId: selectedClub.id, 
      messageCount: clubMessages.length,
      messageIds: clubMessages.map(m => m.id).join(', ')
    });
    
    return (
      <div className="flex-1 h-full flex flex-col">
        <ChatClubContent 
          key={selectedClub.id} // Force re-render when club changes
          club={selectedClub}
          messages={clubMessages}
          onMatchClick={handleMatchClick}
          onSelectUser={onSelectUser}
          onSendMessage={handleSendMessage}
          setClubMessages={setClubMessages}
          clubId={selectedClub.id} // Pass clubId for proper context in ChatInput
          globalMessages={messages} // Pass the global messages state
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

export default React.memo(ChatMainContent);
