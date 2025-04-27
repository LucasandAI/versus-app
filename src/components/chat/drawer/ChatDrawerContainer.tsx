
import React from 'react';
import { Club } from '@/types';
import DMContainer from './dm/DMContainer';
import ChatClubContainer from './club/ChatClubContainer';

interface ChatDrawerContainerProps {
  activeTab: "clubs" | "dm";
  clubs: Club[];
  selectedLocalClub: Club | null;
  onSelectClub: (club: Club) => void;
  messages: Record<string, any[]>;
  deleteChat: (chatId: string) => void;
  unreadMessages: Record<string, number>;
  handleNewMessage: (chatId: string, message: any, isOpen: boolean) => void;
  onSendMessage: (message: string, clubId?: string) => void;
  directMessageUser?: {
    userId: string;
    userName: string;
    userAvatar?: string;
  } | null;
  setDirectMessageUser?: React.Dispatch<React.SetStateAction<{
    userId: string;
    userName: string;
    userAvatar?: string;
  } | null>>;
}

const ChatDrawerContainer: React.FC<ChatDrawerContainerProps> = ({
  activeTab,
  clubs,
  selectedLocalClub,
  onSelectClub,
  messages,
  deleteChat,
  unreadMessages,
  onSendMessage,
  directMessageUser,
  setDirectMessageUser
}) => {
  // Clear selections when switching tabs
  React.useEffect(() => {
    if (activeTab === "clubs") {
      if (directMessageUser && setDirectMessageUser) setDirectMessageUser(null);
    } else if (activeTab === "dm") {
      if (selectedLocalClub) onSelectClub(null as any);
    }
  }, [activeTab, selectedLocalClub, directMessageUser, setDirectMessageUser, onSelectClub]);

  switch (activeTab) {
    case "clubs":
      return (
        <div className="flex h-full w-full">
          <ChatClubContainer
            clubs={clubs}
            selectedClub={selectedLocalClub}
            onSelectClub={onSelectClub}
            messages={messages}
            onSendMessage={onSendMessage}
            unreadCounts={unreadMessages}
            onDeleteChat={deleteChat}
          />
        </div>
      );
    case "dm":
      return (
        <div className="flex h-full w-full">
          <DMContainer 
            initialSelectedUser={directMessageUser}
            setDirectMessageUser={setDirectMessageUser}
          />
        </div>
      );
    default:
      return null;
  }
};

export default ChatDrawerContainer;
