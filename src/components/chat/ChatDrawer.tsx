
import React from 'react';
import { Club } from '@/types';
import { SupportTicket } from '@/types/chat';
import MainChatDrawer from './drawer/MainChatDrawer';

interface ChatDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clubs: Club[];
  onNewMessage?: (count: number) => void;
  supportTickets?: SupportTicket[];
  clubMessages?: Record<string, any[]>;
}

const ChatDrawer: React.FC<ChatDrawerProps> = (props) => {
  return <MainChatDrawer {...props} />;
};

export default ChatDrawer;
