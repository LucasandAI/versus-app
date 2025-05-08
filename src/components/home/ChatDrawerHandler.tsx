
import React from 'react';
import { Club } from '@/types';
import ChatDrawer from '../chat/ChatDrawer';
import { useClubMessages } from '@/hooks/chat/useClubMessages';
import { useApp } from '@/context/AppContext';
import { useChatDrawerGlobal } from '@/context/ChatDrawerContext';

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
  
  console.log('[ChatDrawerHandler] Rendering drawer with isOpen:', isOpen);

  // Handle send message (passthrough function)
  const handleSendMessage = async (message: string, clubId?: string) => {
    console.log('[ChatDrawerHandler] Send message requested:', { message, clubId });
    // This is just a passthrough function - the actual implementation is in MainChatDrawer
  };

  return (
    <ChatDrawer 
      open={isOpen} 
      onOpenChange={(open) => {
        if (!open) close();
      }} 
      clubs={userClubs}
      // We DON'T pass clubMessages or setClubMessages here as they're managed internally
    />
  );
};

export default ChatDrawerHandler;
