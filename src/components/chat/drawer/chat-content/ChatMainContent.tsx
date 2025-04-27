import React, { useEffect } from 'react';
import { Club } from '@/types';
import { SupportTicket } from '@/types/chat';
import ChatClubContent from '../../ChatClubContent';
import ChatTicketContent from '../../ChatTicketContent';

interface ChatMainContentProps {
  selectedClub: Club | null;
  selectedTicket: SupportTicket | null;
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
  setClubMessages,
}) => {
  // Enhanced debugging for component renders and selections
  useEffect(() => {
    console.log('[ChatMainContent] Rendering with:', {
      hasSelectedClub: !!selectedClub,
      hasSelectedTicket: !!selectedTicket,
      clubId: selectedClub?.id,
      ticketId: selectedTicket?.id
    });
  }, [selectedClub, selectedTicket]);

  // Render ticket content if there's a selected ticket
  if (selectedTicket) {
    console.log('[ChatMainContent] Rendering support ticket content for:', selectedTicket.id);
    return (
      <div className="flex-1 h-full flex flex-col">
        <ChatTicketContent 
          key={selectedTicket.id} // Force re-render when ticket changes
          ticket={selectedTicket}
          onSendMessage={(message) => {
            console.log('[ChatMainContent] Sending support ticket message');
            onSendMessage(message);
          }}
          onTicketClosed={() => {
            console.log('[ChatMainContent] Ticket closed');
            // This function is just a placeholder, as it's necessary for the type
            // The actual closing functionality is handled in ChatTicketContent component
          }}
        />
      </div>
    );
  }

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
