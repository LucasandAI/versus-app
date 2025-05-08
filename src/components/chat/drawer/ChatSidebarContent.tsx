
import React, { useMemo } from 'react';
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
  // Create a stable key for forced re-renders that doesn't change on every render
  const unreadKey = useMemo(() => {
    const sortedArray = [...unreadClubs].sort().join(',');
    return `sidebar-${sortedArray}`;
  }, [unreadClubs]);
  
  return (
    <div className="h-full flex flex-col overflow-hidden">
      <ChatSidebar
        key={unreadKey}
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

export default React.memo(ChatSidebarContent);
