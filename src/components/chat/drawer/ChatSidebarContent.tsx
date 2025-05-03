
import React, { useState, useEffect } from 'react';
import { Club } from '@/types';
import ChatSidebar from '../ChatSidebar';
import { useUnreadMessages } from '@/context/unread-messages';

interface ChatSidebarContentProps {
  clubs: Club[];
  selectedClub: Club | null;
  onSelectClub: (club: Club) => void;
  onDeleteChat?: (chatId: string) => void;
  unreadCounts?: Record<string, number>;
  unreadClubs?: Set<string>;
  unreadConversations?: Set<string>;
  onSelectUser: (userId: string, userName: string, userAvatar?: string) => void;
  activeTab: "clubs" | "dm";
}

const ChatSidebarContent: React.FC<ChatSidebarContentProps> = ({
  clubs,
  selectedClub,
  onSelectClub,
  onDeleteChat,
  unreadCounts,
  unreadClubs: propUnreadClubs,
  unreadConversations: propUnreadConversations,
  onSelectUser,
  activeTab
}) => {
  const { unreadClubs: contextUnreadClubs, unreadConversations: contextUnreadConversations, forceRefresh } = useUnreadMessages();
  const unreadClubs = propUnreadClubs || contextUnreadClubs;
  const unreadConversations = propUnreadConversations || contextUnreadConversations;
  
  // State to track changes in unread state
  const [updateCounter, setUpdateCounter] = useState(0);
  
  // Listen for unread state changes
  useEffect(() => {
    const handleUnreadUpdate = () => {
      setUpdateCounter(prev => prev + 1);
      forceRefresh();
    };
    
    window.addEventListener('unreadMessagesUpdated', handleUnreadUpdate);
    window.addEventListener('clubMessageReceived', handleUnreadUpdate);
    window.addEventListener('clubMessagesRead', handleUnreadUpdate);
    window.addEventListener('dmMessageReceived', handleUnreadUpdate);
    
    return () => {
      window.removeEventListener('unreadMessagesUpdated', handleUnreadUpdate);
      window.removeEventListener('clubMessageReceived', handleUnreadUpdate);
      window.removeEventListener('clubMessagesRead', handleUnreadUpdate);
      window.removeEventListener('dmMessageReceived', handleUnreadUpdate);
    };
  }, [forceRefresh]);
  
  // Create a key for forced re-renders
  const unreadKey = `${updateCounter}-${Array.from(unreadClubs).sort().join(',')}-${Array.from(unreadConversations).sort().join(',')}`;
  console.log(`[ChatSidebarContent] Rendering with key: ${unreadKey}`);
  
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

export default React.memo(ChatSidebarContent);
