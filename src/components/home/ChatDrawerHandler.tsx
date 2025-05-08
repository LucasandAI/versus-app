
import React, { useEffect } from 'react';
import { Club } from '@/types';
import ChatDrawer from '../chat/ChatDrawer';
import { useApp } from '@/context/AppContext';
import { useChatDrawerGlobal } from '@/context/ChatDrawerContext';
import { useChat } from '@/context/ChatContext';

interface ChatDrawerHandlerProps {
  userClubs: Club[];
  onSelectUser: (userId: string, name: string) => void;
}

const ChatDrawerHandler: React.FC<ChatDrawerHandlerProps> = ({
  userClubs,
  onSelectUser
}) => {
  const { isOpen, close } = useChatDrawerGlobal();
  const { currentUser } = useApp();
  const { 
    clubMessages, 
    directMessages,
    sendClubMessage,
    sendDirectMessage,
    deleteMessage,
    unreadClubs,
    unreadConversations,
    markClubAsRead,
    markConversationAsRead,
    selectedClub,
    setSelectedClub,
    selectedConversation,
    setSelectedConversation
  } = useChat();
  
  console.log('[ChatDrawerHandler] Rendering with clubMessages:', Object.keys(clubMessages).length);
  
  const handleSendMessage = async (message: string, clubId?: string) => {
    if (message && clubId) {
      console.log('[ChatDrawerHandler] Sending club message:', { clubId });
      await sendClubMessage(clubId, message);
    }
  };
  
  const handleSendDirectMessage = async (message: string, conversationId: string, receiverId: string) => {
    if (message && conversationId && receiverId) {
      console.log('[ChatDrawerHandler] Sending direct message:', { conversationId, receiverId });
      await sendDirectMessage(conversationId, receiverId, message);
    }
  };
  
  const handleDeleteMessage = async (messageId: string, type: 'club' | 'direct', contextId: string) => {
    console.log('[ChatDrawerHandler] Deleting message:', { messageId, type, contextId });
    await deleteMessage(messageId, type, contextId);
  };

  return (
    <ChatDrawer 
      open={isOpen} 
      onOpenChange={(open) => {
        if (!open) close();
      }} 
      clubs={userClubs}
      clubMessages={clubMessages}
      directMessages={directMessages}
      selectedClub={selectedClub}
      setSelectedClub={setSelectedClub}
      selectedConversation={selectedConversation}
      setSelectedConversation={setSelectedConversation}
      onSendMessage={handleSendMessage}
      onSendDirectMessage={handleSendDirectMessage}
      onDeleteMessage={handleDeleteMessage}
      unreadClubs={unreadClubs}
      unreadConversations={unreadConversations}
      markClubAsRead={markClubAsRead}
      markConversationAsRead={markConversationAsRead}
      onSelectUser={onSelectUser}
    />
  );
};

export default ChatDrawerHandler;
