
import React from 'react';
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
  // Only render club content if selectedTicket is null
  if (selectedClub && !selectedTicket) {
    const clubMessages = messages[selectedClub.id] || [];
    console.log('[ChatMainContent] Rendering club messages:', { 
      clubId: selectedClub.id, 
      messageCount: clubMessages.length,
      messageIds: clubMessages.map(m => m.id).join(', ')
    });
    
    return (
      <ChatClubContent 
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
      />
    );
  }

  if (selectedTicket) {
    return (
      <ChatTicketContent 
        ticket={selectedTicket}
        onSendMessage={(message) => {
          console.log('[ChatMainContent] Sending support ticket message');
          onSendMessage(message);
        }}
      />
    );
  }

  return (
    <div className="flex items-center justify-center h-full text-gray-500">
      {selectedClub ? 'Loading chat...' : 'Select a club to start chatting'}
    </div>
  );
};

export default ChatMainContent;
