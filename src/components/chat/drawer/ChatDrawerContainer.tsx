
import React, { useState, useEffect } from 'react';
import { Club } from '@/types';
import ChatSidebar from '../ChatSidebar';
import ChatClubContainer from './club/ChatClubContainer';
import DMContainer from './dm/DMContainer';
import { useClubMessages } from '@/hooks/chat/useClubMessages';
import { useInitialMessages } from '@/hooks/chat/messages/useInitialMessages';
import { useApp } from '@/context/AppContext';
import LoadingScreen from '@/components/shared/LoadingScreen';

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
  handleNewMessage: (message: any) => void;
  onSendMessage: (message: string, clubId?: string) => Promise<void> | void;
  onDeleteMessage?: (messageId: string) => Promise<void> | void;
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
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  
  // Manage club messages with the useClubMessages hook
  const { clubMessages, setClubMessages, isLoading: messagesLoading } = useClubMessages(clubs, true);
  
  // Initialize messages
  useInitialMessages(clubs, true, setClubMessages);
  
  // Set initial loading state
  useEffect(() => {
    if (!messagesLoading) {
      // Give a slight delay to ensure smooth transition
      const timer = setTimeout(() => {
        setIsInitialLoading(false);
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [messagesLoading]);

  // Ensure we use the passed messages prop if available, otherwise use the clubMessages state
  const finalMessages = messages && Object.keys(messages).length > 0 
    ? messages as Record<string, any[]> 
    : clubMessages;

  // Show loading state if initial loading
  if (isInitialLoading && activeTab === "clubs") {
    return <LoadingScreen message="Loading chat messages..." subMessage="Preparing your conversations" />;
  }
  
  return (
    <div className="flex flex-grow h-full overflow-hidden">
      {activeTab === "clubs" ? (
        <>
          {/* Club chat sidebar */}
          <div className="w-80 border-r">
            <ChatSidebar
              clubs={clubs}
              selectedClub={selectedLocalClub}
              onSelectClub={onSelectClub}
              onDeleteChat={deleteChat}
              unreadCounts={unreadMessages}
              unreadClubs={unreadClubs}
              onSelectUser={(userId, userName, userAvatar) => {
                setDirectMessageUser({
                  userId,
                  userName,
                  userAvatar: userAvatar || '/placeholder.svg',
                  conversationId: 'new'
                });
              }}
              activeTab={activeTab}
              clubMessages={finalMessages}
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
