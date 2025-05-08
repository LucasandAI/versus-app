
import React from 'react';
import { Club } from '@/types';
import ClubsList from './ClubsList';
import ChatClubContent from '../../ChatClubContent';
import { ClubMessage } from '@/context/ChatContext';

interface ChatClubContainerProps {
  clubs: Club[];
  selectedClub: Club | null;
  onSelectClub: (club: Club) => void;
  clubMessages: Record<string, ClubMessage[]>;
  unreadClubs: Set<string>;
  onSendMessage: (message: string, clubId?: string) => void;
  onDeleteMessage?: (messageId: string, type: 'club' | 'direct', contextId: string) => void;
  onSelectUser: (userId: string, userName: string, userAvatar?: string) => void;
}

const ChatClubContainer: React.FC<ChatClubContainerProps> = ({
  clubs,
  selectedClub,
  onSelectClub,
  clubMessages,
  unreadClubs,
  onSendMessage,
  onDeleteMessage,
  onSelectUser
}) => {
  // If no club is selected, show the clubs list
  if (!selectedClub) {
    return (
      <div className="h-full">
        <ClubsList 
          clubs={clubs} 
          onSelectClub={onSelectClub}
          unreadClubs={unreadClubs}
        />
      </div>
    );
  }

  // If a club is selected, show its content
  return (
    <div className="h-full">
      <ChatClubContent
        club={selectedClub}
        messages={clubMessages[selectedClub.id] || []}
        onMatchClick={() => {}}
        onSelectUser={onSelectUser}
        onSendMessage={onSendMessage}
        onDeleteMessage={(messageId) => onDeleteMessage?.(messageId, 'club', selectedClub.id)}
      />
    </div>
  );
};

export default ChatClubContainer;
