
import React, { useMemo } from 'react';
import { Club } from '@/types';
import ClubsList from './ClubsList';
import ChatEmpty from '../../ChatEmpty';
import ChatClubContent from '../../ChatClubContent';
import { useNavigation } from '@/hooks/useNavigation';

interface ChatClubContainerProps {
  clubs: Club[];
  selectedClub: Club | null;
  onSelectClub: (club: Club) => void;
  unreadClubs: Set<string>;
  onSendMessage: (message: string, clubId?: string) => void;
  onDeleteMessage?: (messageId: string) => void;
}

const ChatClubContainer: React.FC<ChatClubContainerProps> = ({
  clubs,
  selectedClub,
  onSelectClub,
  unreadClubs,
  onSendMessage,
  onDeleteMessage
}) => {
  const { navigateToMatches } = useNavigation();

  // Clubs sorted by unread status first, then alphabetically
  const sortedClubs = useMemo(() => {
    return [...clubs].sort((a, b) => {
      // First, sort by unread status
      const aUnread = unreadClubs.has(a.id);
      const bUnread = unreadClubs.has(b.id);
      if (aUnread && !bUnread) return -1;
      if (!aUnread && bUnread) return 1;
      
      // Then sort alphabetically
      return a.name.localeCompare(b.name);
    });
  }, [clubs, unreadClubs]);

  const handleSelectUser = (userId: string, userName: string, userAvatar?: string) => {
    const event = new CustomEvent('openDirectMessage', { 
      detail: { 
        userId, 
        userName, 
        userAvatar 
      } 
    });
    window.dispatchEvent(event);
  };

  return (
    <div className="h-full flex">
      {/* Left sidebar - club list */}
      <div className="w-1/3 border-r overflow-y-auto">
        <ClubsList 
          clubs={sortedClubs}
          selectedClub={selectedClub}
          onSelectClub={onSelectClub}
          unreadClubs={unreadClubs}
        />
      </div>
      
      {/* Right side - club chat or empty state */}
      <div className="flex-1">
        {selectedClub ? (
          <ChatClubContent
            club={selectedClub}
            onMatchClick={() => navigateToMatches(selectedClub.id)}
            onSelectUser={handleSelectUser}
            onSendMessage={onSendMessage}
            onDeleteMessage={onDeleteMessage}
          />
        ) : (
          <ChatEmpty />
        )}
      </div>
    </div>
  );
};

export default ChatClubContainer;
