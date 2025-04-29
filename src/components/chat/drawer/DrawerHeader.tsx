
import React from 'react';
import { Club } from '@/types';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useApp } from '@/context/AppContext';
import { useUnreadMessages } from '@/context/UnreadMessagesContext';
import { useUnreadCounts } from '@/hooks/chat/useUnreadCounts';

interface DrawerHeaderProps {
  activeTab: "clubs" | "dm";
  setActiveTab: (tab: "clubs" | "dm") => void;
  selectedClub: Club | null;
}

const DrawerHeader: React.FC<DrawerHeaderProps> = ({ 
  activeTab, 
  setActiveTab,
  selectedClub 
}) => {
  const { currentUser } = useApp();
  const { unreadConversations } = useUnreadMessages();
  const { unreadClubs } = useUnreadCounts(currentUser?.id);

  return (
    <div className="px-4 py-2 border-b">
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "clubs" | "dm")}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="clubs" className="inline-flex items-center gap-2">
            Club Chat
            {unreadClubs.size > 0 && (
              <span className="inline-flex h-2 w-2 bg-red-500 rounded-full" />
            )}
          </TabsTrigger>
          <TabsTrigger value="dm" className="inline-flex items-center gap-2">
            Direct Messages
            {unreadConversations.size > 0 && (
              <span className="inline-flex h-2 w-2 bg-red-500 rounded-full" />
            )}
          </TabsTrigger>
        </TabsList>
      </Tabs>
    </div>
  );
};

export default DrawerHeader;
