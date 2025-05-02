
import React, { useEffect } from 'react';
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
}) => {
  // Log active club for debugging
  useEffect(() => {
    console.log('[ChatDrawerContainer] Selected club:', {
      id: selectedLocalClub?.id,
      name: selectedLocalClub?.name,
      activeTab
    });
  }, [selectedLocalClub, activeTab]);
  
  return (
    <div className="flex-1 overflow-hidden">
      {activeTab === 'clubs' ? (
        <ChatClubContainer 
          clubs={clubs}
          selectedClub={selectedLocalClub}
          onSelectClub={onSelectClub}
          messages={messages}
          unreadClubs={unreadClubs}
          onSendMessage={onSendMessage}
          onDeleteMessage={onDeleteMessage}
          activeClubId={selectedLocalClub?.id ?? null}
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
