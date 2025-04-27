
import React from 'react';
import { Club } from '@/types';
import MainChatDrawer from './drawer/MainChatDrawer';

interface ChatDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clubs: Club[];
  onNewMessage?: (count: number) => void;
  clubMessages?: Record<string, any[]>;
  onSendMessage?: (message: string, clubId?: string) => Promise<void> | void;
}

const ChatDrawer: React.FC<ChatDrawerProps> = (props) => {
  return <MainChatDrawer {...props} />;
};

export default ChatDrawer;
