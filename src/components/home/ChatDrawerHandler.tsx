
import React from 'react';
import { Club } from '@/types';
import { SupportTicket } from '@/types/chat';
import ChatDrawer from '../chat/ChatDrawer';
import { useChatDrawerMessages } from '@/hooks/chat/useChatDrawerMessages';
import { useRealtimeChat } from '@/hooks/chat/useRealtimeChat';
import { useApp } from '@/context/AppContext';
import { useChatDrawerGlobal } from '@/context/ChatDrawerContext';

interface ChatDrawerHandlerProps {
  userClubs: Club[];
  onSelectUser: (userId: string, name: string) => void;
  supportTickets: SupportTicket[];
  setUnreadMessages: (count: number) => void;
}

const ChatDrawerHandler: React.FC<ChatDrawerHandlerProps> = ({
  userClubs,
  onSelectUser,
  supportTickets,
  setUnreadMessages
}) => {
  const { isOpen, close } = useChatDrawerGlobal();
  const { currentUser } = useApp();
  
  const { clubMessages } = useChatDrawerMessages(userClubs, isOpen);
  useRealtimeChat(currentUser?.id, userClubs);

  return (
    <ChatDrawer 
      open={isOpen} 
      onOpenChange={(open) => {
        if (!open) close();
      }} 
      clubs={userClubs}
      supportTickets={supportTickets}
      clubMessages={clubMessages}
      onNewMessage={setUnreadMessages}
    />
  );
};

export default ChatDrawerHandler;
