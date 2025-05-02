import React from 'react';
import { Club } from '@/types';
import ChatClubContainer from './club/ChatClubContainer';
import DMContainer from './dm/DMContainer';

interface ChatDrawerContainerProps {
  activeTab: "clubs" | "dm";
  clubs: Club[];
  selectedLocalClub: Club | null;
  onSelectClub: (club: Club) => void;
  messages?: Record<string, any[]>;
  deleteChat: (chatId: string) => void;
  unreadMessages: Record<string, number>;
  unreadClubs?: Set<string>;
  unreadConversations?: Set<string>;
  handleNewMessage: (clubId: string, message: any, isOpen: boolean) => void;
  onSendMessage: (message: string, clubId?: string) => void;
  onDeleteMessage?: (messageId: string) => void;
  directMessageUser: {
    userId: string;
    userName: string;
    userAvatar: string; // Made required
    conversationId: string;
  } | null;
  setDirectMessageUser: React.Dispatch<React.SetStateAction<{
    userId: string;
    userName: string;
    userAvatar: string; // Made required
    conversationId: string;
  } | null>>;
  activeClubId?: string | null;
  setActiveClubId?: (clubId: string | null) => void;
  activeClubMessages?: any[];
}

const ChatDrawerContainer: React.FC<ChatDrawerContainerProps> = ({
  activeTab,
  clubs,
  selectedLocalClub,
  onSelectClub,
  messages = {},
  deleteChat,
  unreadMessages,
  unreadClubs = new Set(),
  unreadConversations = new Set(),
  handleNewMessage,
  onSendMessage,
  onDeleteMessage,
  directMessageUser,
  setDirectMessageUser,
  activeClubId,
  setActiveClubId,
  activeClubMessages
}) => {
  // Create a key for forced re-renders when unread status changes
  const unreadKey = JSON.stringify([...unreadClubs].sort());
  
  return (
    <div className="flex-1 overflow-hidden">
      {activeTab === 'clubs' ? (
        <ChatClubContainer 
          key={`club-container-${unreadKey}`}
          clubs={clubs}
          selectedClub={selectedLocalClub}
          onSelectClub={onSelectClub}
          messages={messages}
          unreadClubs={unreadClubs}
          onSendMessage={onSendMessage}
          onDeleteMessage={onDeleteMessage}
          activeClubMessages={activeClubMessages}
        />
      ) : (
        <DMContainer
          directMessageUser={directMessageUser}
          setDirectMessageUser={setDirectMessageUser}
          unreadConversations={unreadConversations}
        />
      )}
    </div>
  );
};

export default ChatDrawerContainer;
