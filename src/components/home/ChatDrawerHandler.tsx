
import React from 'react';
import { Club } from '@/types';
import ChatDrawer from '../chat/ChatDrawer';
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

  return (
    <ChatDrawer 
      open={isOpen} 
      onOpenChange={(open) => {
        if (!open) close();
      }} 
      clubs={userClubs}
    />
  );
};

export default ChatDrawerHandler;
