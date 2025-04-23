
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
}

const ChatMainContent: React.FC<ChatMainContentProps> = ({
  selectedClub,
  selectedTicket,
  messages,
  onMatchClick,
  onSelectUser,
  onSendMessage,
}) => {
  if (selectedClub) {
    const clubMessages = messages[selectedClub.id] || [];
    console.log('[ChatMainContent] Rendering club messages:', { 
      clubId: selectedClub.id, 
      messageCount: clubMessages.length 
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

  return null;
};

export default ChatMainContent;
