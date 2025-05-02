import React from 'react';
import { Club } from '@/types';
import ChatClubContainer from './club/ChatClubContainer';
import DMContainer from './dm/DMContainer';

interface ChatDrawerContainerProps {
  activeTab: 'clubs' | 'dm';
  clubs: Club[];
  selectedLocalClub: Club | null;
  onSelectClub: (club: Club) => void;
  unreadClubs: Set<string>;
  unreadConversations: Set<string>;
  directMessageUser: {
    userId: string;
    userName: string;
    userAvatar: string;
    conversationId: string;
  } | null;
  setDirectMessageUser: React.Dispatch<React.SetStateAction<{
    userId: string;
    userName: string;
    userAvatar: string;
    conversationId: string;
  } | null>>;
}

const ChatDrawerContainer: React.FC<ChatDrawerContainerProps> = ({
  activeTab,
  clubs,
  selectedLocalClub,
  onSelectClub,
  unreadClubs,
  unreadConversations,
  directMessageUser,
  setDirectMessageUser
}) => {
  const handleSelectUser = (userId: string, userName: string, userAvatar?: string) => {
    // Implementation remains the same
    console.log('[ChatDrawerContainer] selectUser:', { userId, userName });
    setDirectMessageUser({
      userId,
      userName,
      userAvatar: userAvatar || '/placeholder.svg',
      conversationId: 'new'
    });
  };

  // Show clubs tab content
  if (activeTab === 'clubs') {
    return (
      <ChatClubContainer
        clubs={clubs}
        selectedClub={selectedLocalClub}
        onSelectClub={onSelectClub}
        unreadClubs={unreadClubs}
      />
    );
  }

  // Show direct messages tab content
  return (
    <DMContainer
      directMessageUser={directMessageUser}
      setDirectMessageUser={setDirectMessageUser}
      unreadConversations={unreadConversations}
    />
  );
};

export default ChatDrawerContainer;
