
import React from 'react';
import { Club } from '@/types';
import ChatDrawer from '../chat/ChatDrawer';
import { useClubMessages } from '@/hooks/chat/useClubMessages';
import { useApp } from '@/context/AppContext';
import { useChatDrawerGlobal } from '@/context/ChatDrawerContext';

interface ChatDrawerHandlerProps {
  userClubs: Club[];
  onSelectUser: (userId: string, name: string) => void;
  setUnreadMessages: (count: number) => void;
}

const ChatDrawerHandler: React.FC<ChatDrawerHandlerProps> = ({
  userClubs,
  onSelectUser,
  setUnreadMessages
}) => {
  const { isOpen, close } = useChatDrawerGlobal();
  const { currentUser } = useApp();
  
  // Use our hook for real-time club messages
  const { clubMessages } = useClubMessages(userClubs, isOpen, setUnreadMessages);

  console.log('[ChatDrawerHandler] Rendering with clubMessages:', clubMessages);

  return (
    <ChatDrawer 
      open={isOpen} 
      onOpenChange={(open) => {
        if (!open) close();
      }} 
      clubs={userClubs}
      clubMessages={clubMessages}
      onNewMessage={setUnreadMessages}
    />
  );
};

export default ChatDrawerHandler;
