
import React, { useState } from 'react';
import { Club } from '@/types';
import ChatSidebar from '../ChatSidebar';

interface ChatSidebarContentProps {
  clubs: Club[];
  selectedClub: Club | null;
  onSelectClub: (club: Club) => void;
  onDeleteChat?: (chatId: string) => void;
  unreadCounts?: Record<string, number>;
  unreadClubs?: Set<string>;
  onSelectUser: (userId: string, userName: string, userAvatar?: string) => void;
  activeTab: "clubs" | "dm";
}

const ChatSidebarContent: React.FC<ChatSidebarContentProps> = ({
  clubs,
  selectedClub,
  onSelectClub,
  onDeleteChat,
  unreadCounts,
  unreadClubs = new Set(),
  onSelectUser,
  activeTab
}) => {
  const [refreshToggle, setRefreshToggle] = useState(false);
  
  // Create a key for forced re-renders
  const unreadKey = `${Array.from(unreadClubs).sort().join(',')}-${refreshToggle}`;
  
  return (
    <div className="h-full flex flex-col overflow-hidden">
      <ChatSidebar
        key={`chat-sidebar-${unreadKey}`}
        clubs={clubs}
        selectedClub={selectedClub}
        onSelectClub={onSelectClub}
        onDeleteChat={onDeleteChat}
        unreadCounts={unreadCounts}
        unreadClubs={unreadClubs}
        onSelectUser={onSelectUser}
        activeTab={activeTab}
      />
    </div>
  );
};

export default ChatSidebarContent;
