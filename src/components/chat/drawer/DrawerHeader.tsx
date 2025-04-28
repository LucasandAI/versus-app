
import React from 'react';
import { Club } from '@/types';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useApp } from '@/context/AppContext';
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
  const { unreadConversations, unreadClubs } = useUnreadCounts(currentUser?.id);

  const hasUnreadClubs = unreadClubs.size > 0;
  const hasUnreadConversations = unreadConversations.size > 0;

  return (
    <div className="px-4 py-2 border-b">
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "clubs" | "dm")}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="clubs" className="inline-flex items-center gap-2">
            Club Chat
            {hasUnreadClubs && (
              <span className="inline-flex h-2 w-2 bg-red-500 rounded-full" />
            )}
          </TabsTrigger>
          <TabsTrigger value="dm" className="inline-flex items-center gap-2">
            Direct Messages
            {hasUnreadConversations && (
              <span className="inline-flex h-2 w-2 bg-red-500 rounded-full" />
            )}
          </TabsTrigger>
        </TabsList>
      </Tabs>
    </div>
  );
};

export default DrawerHeader;
