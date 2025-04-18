
import React from 'react';
import { Club } from '@/types';
import { SupportTicket } from '@/types/chat';
import ChatDrawer from '../chat/ChatDrawer';
import { useChatDrawer } from '@/hooks/home/useChatDrawer';

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
  const { chatDrawerOpen, setChatDrawerOpen } = useChatDrawer();

  return (
    <ChatDrawer 
      open={chatDrawerOpen} 
      onOpenChange={(open) => {
        setChatDrawerOpen(open);
        if (!open) {
          const event = new CustomEvent('chatDrawerClosed');
          window.dispatchEvent(event);
        }
      }} 
      clubs={userClubs}
      onNewMessage={(count) => setUnreadMessages(count)} 
      supportTickets={supportTickets}
    />
  );
};

export default ChatDrawerHandler;

