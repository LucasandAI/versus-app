import React from 'react';
import { Club } from '@/types';

export interface ChatClubContentProps {
  club: Club;
  onMatchClick: () => void;
  onSelectUser: (userId: string, userName: string, userAvatar?: string) => void;
  onSendMessage: (message: string, clubId?: string) => void;
  onDeleteMessage?: (messageId: string) => void;
}

const ChatClubContent: React.FC<ChatClubContentProps> = ({
  club,
  onMatchClick,
  onSelectUser,
  onSendMessage,
  onDeleteMessage
}) => {
  return (
    <div className="p-4">
      <h2>{club.name} Chat</h2>
      <p>This is the chat content for the club: {club.name}</p>
      <button onClick={onMatchClick}>View Matches</button>
      <button onClick={() => onSelectUser('user123', 'John Doe')}>Chat with John</button>
      <button onClick={() => onSendMessage('Hello!', club.id)}>Send Message</button>
      {onDeleteMessage && <button onClick={() => onDeleteMessage('message123')}>Delete Message</button>}
    </div>
  );
};

export default ChatClubContent;
