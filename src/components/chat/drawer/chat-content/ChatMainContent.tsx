
import React, { useEffect } from 'react';
import { Club } from '@/types';
import ChatClubContent from '../../ChatClubContent';

interface ChatMainContentProps {
  clubId: string;
  clubName: string;
  selectedClub?: Club | null;
  selectedTicket?: null;
  messages: any[]; // Changed from Record<string, any[]> to any[]
  onMatchClick?: (club: Club) => void;
  onSelectUser?: (userId: string, userName: string, userAvatar?: string) => void;
  onSendMessage: (message: string, clubId?: string) => void;
  onDeleteMessage?: (messageId: string) => void;
  setClubMessages?: React.Dispatch<React.SetStateAction<Record<string, any[]>>>;
}

const ChatMainContent: React.FC<ChatMainContentProps> = ({
  clubId,
  clubName,
  selectedClub,
  selectedTicket,
  messages,
  onMatchClick,
  onSelectUser,
  onSendMessage,
  onDeleteMessage,
  setClubMessages,
}) => {
  // Enhanced debugging for component renders and selections
  useEffect(() => {
    console.log('[ChatMainContent] Rendering with:', {
      hasSelectedClub: !!selectedClub,
      clubId: clubId
    });
  }, [selectedClub, clubId]);

  // If we have a selected club, render the club content
  if (clubId) {
    console.log('[ChatMainContent] Rendering club messages:', { 
      clubId: clubId, 
      messageCount: messages.length,
      messageIds: messages.map(m => m.id).join(', ')
    });
    
    return (
      <div className="flex-1 h-full flex flex-col">
        <ChatClubContent 
          key={clubId} // Force re-render when club changes
          club={selectedClub || { id: clubId, name: clubName } as Club}
          messages={messages}
          onMatchClick={selectedClub && onMatchClick ? () => onMatchClick(selectedClub) : undefined}
          onSelectUser={onSelectUser}
          onSendMessage={(message) => {
            console.log('[ChatMainContent] Sending club message to:', { 
              clubId: clubId, 
              messageLength: message.length 
            });
            onSendMessage(message, clubId);
          }}
          setClubMessages={setClubMessages}
          clubId={clubId} // Pass clubId for proper context in ChatInput
        />
      </div>
    );
  }

  // If nothing is selected, show an empty state
  return (
    <div className="flex items-center justify-center h-full text-gray-500">
      {clubId ? 'Loading chat...' : 'Select a club to start chatting'}
    </div>
  );
};

export default ChatMainContent;
