
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
}

const ChatDrawerContainer: React.FC<ChatDrawerContainerProps> = ({
  activeTab,
  clubs,
  selectedLocalClub,
  onSelectClub,
  messages = {},
  deleteChat,
  unreadMessages,
  handleNewMessage,
  onSendMessage,
  onDeleteMessage,
  directMessageUser,
  setDirectMessageUser
}) => {
  return (
    <div className="flex-1 overflow-hidden">
      {activeTab === 'clubs' ? (
        <ChatClubContainer 
          selectedClub={selectedLocalClub}
          messages={messages}
          onSendMessage={onSendMessage}
          onDeleteMessage={onDeleteMessage}
        />
      ) : (
        <DMContainer
          directMessageUser={directMessageUser}
          setDirectMessageUser={setDirectMessageUser}
        />
      )}
    </div>
  );
};

export default ChatDrawerContainer;
