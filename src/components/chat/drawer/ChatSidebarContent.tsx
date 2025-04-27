
import React from 'react';
import { Club } from '@/types';
import ChatSidebar from '../ChatSidebar';

interface ChatSidebarContentProps {
  clubs: Club[];
  selectedClub: Club | null;
  onSelectClub: (club: Club) => void;
  onDeleteChat?: (chatId: string) => void;
  unreadCounts?: Record<string, number>;
  onSelectUser: (userId: string, userName: string, userAvatar?: string) => void;
  activeTab: "clubs" | "dm";
  clubMessages?: Record<string, any[]>;
}

const ChatSidebarContent: React.FC<ChatSidebarContentProps> = (props) => {
  return (
    <ChatSidebar {...props} />
  );
};

export default ChatSidebarContent;

