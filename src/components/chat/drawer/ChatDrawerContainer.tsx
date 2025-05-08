import React from 'react';
import { Club } from '@/types';
import { useClubMessages } from '@/hooks/chat/useClubMessages';
import { useInitialMessages } from '@/hooks/chat/messages/useInitialMessages';
import { useApp } from '@/context/AppContext';
import ChatSidebarContent from './ChatSidebarContent';
import ChatClubContainer from './club/ChatClubContainer';
import DMContainer from './dm/DMContainer';

interface ChatDrawerContainerProps {
  activeTab: "clubs" | "dm";
  clubs: Club[];
  selectedLocalClub: Club | null;
  onSelectClub: (club: Club | null) => void;
  messages?: Record<string, any[]>;
  deleteChat?: (clubId: string) => void;
  unreadMessages?: Record<string, number>;
  unreadClubs?: Set<string>;
  unreadConversations?: Set<string>;
  handleNewMessage?: () => void;
  onSendMessage?: (message: string, clubId: string) => void;
  onDeleteMessage?: (messageId: string) => void;
  directMessageUser?: {
    userId: string;
    userName: string;
    userAvatar: string;
    conversationId: string;
  } | null;
  setDirectMessageUser?: (user: {
    userId: string;
    userName: string;
    userAvatar: string;
    conversationId: string;
  } | null) => void;
}

const ChatDrawerContainer: React.FC<ChatDrawerContainerProps> = ({
  activeTab,
  clubs,
  selectedLocalClub,
  onSelectClub,
  messages,
  deleteChat,
  unreadMessages,
  unreadClubs,
  unreadConversations,
  handleNewMessage,
  onSendMessage,
  onDeleteMessage,
  directMessageUser,
  setDirectMessageUser
}) => {
  const { currentUser } = useApp();
  
  // Manage club messages with the useClubMessages hook
  const { clubMessages, setClubMessages } = useClubMessages(clubs, true);
  
  // Initialize messages
  useInitialMessages(clubs, true, setClubMessages);

  // Ensure we use the passed messages prop if available, otherwise use the clubMessages state
  const finalMessages = messages && Object.keys(messages).length > 0 
    ? messages as Record<string, any[]> 
    : clubMessages;

  return (
    <div className="flex flex-grow h-full overflow-hidden">
      {activeTab === "clubs" ? (
        <>
          {/* Club chat sidebar */}
          <div className="w-80 border-r">
            <ChatSidebarContent
              clubs={clubs}
              selectedClub={selectedLocalClub}
              onSelectClub={onSelectClub}
              onDeleteChat={deleteChat}
              unreadCounts={unreadMessages}
              unreadClubs={unreadClubs}
              onSelectUser={(userId, userName, userAvatar) => {
                setDirectMessageUser?.({
                  userId,
                  userName,
                  userAvatar: userAvatar || '/placeholder.svg',
                  conversationId: 'new'
                });
              }}
              activeTab={activeTab}
            />
          </div>

          {/* Club chat content */}
          <div className="flex-1 flex flex-col">
            <ChatClubContainer
              selectedClub={selectedLocalClub}
              messages={selectedLocalClub ? finalMessages[selectedLocalClub.id] || [] : []}
              clubs={clubs}
              onSendMessage={onSendMessage}
              onDeleteMessage={onDeleteMessage}
            />
          </div>
        </>
      ) : (
        // Direct messages container
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
