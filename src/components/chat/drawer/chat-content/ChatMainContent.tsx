
import React from 'react';
import { Club } from '@/types';
import ChatClubContent from '../../ChatClubContent';
import ChatEmpty from '../../ChatEmpty';

interface ChatMainContentProps {
  selectedClub: Club | null;
  messages: any[];
  onSendMessage: (message: string) => Promise<any>;
  setClubMessages?: React.Dispatch<React.SetStateAction<Record<string, any[]>>>;
}

const ChatMainContent: React.FC<ChatMainContentProps> = ({ 
  selectedClub, 
  messages, 
  onSendMessage,
  setClubMessages 
}) => {
  if (!selectedClub) {
    return <ChatEmpty />;
  }

  return (
    <ChatClubContent
      club={selectedClub}
      messages={messages}
      onSendMessage={onSendMessage}
      onMatchClick={() => {}}
      onSelectUser={() => {}}
      setClubMessages={setClubMessages}
    />
  );
};

export default ChatMainContent;
