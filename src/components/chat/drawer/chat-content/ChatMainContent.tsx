
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

  // Effect to log when messages update
  useEffect(() => {
    if (selectedClub && messages[selectedClub.id]) {
      console.log('[ChatMainContent] Messages updated for club:', {
        clubId: selectedClub.id,
        messageCount: messages[selectedClub.id]?.length || 0
      });
    }
  }, [messages, selectedClub]);

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
          key={`club-content-${selectedClub.id}`} // Remove timestamp to avoid unnecessary remounts
          club={selectedClub}
          messages={clubMessages}
          onMatchClick={() => onMatchClick(selectedClub)}
          onSelectUser={onSelectUser}
          onSendMessage={(message) => {
            console.log('[ChatMainContent] Sending club message to:', { 
              clubId: selectedClub.id, 
              messageLength: message.length 
            });
            onSendMessage(message, selectedClub.id);
          }}
          setClubMessages={setClubMessages}
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
