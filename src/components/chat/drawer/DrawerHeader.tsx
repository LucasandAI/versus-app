
import React, { useEffect } from 'react';
import { Club } from '@/types';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useUnreadMessages } from '@/context/UnreadMessagesContext';
import { Badge } from '@/components/ui/badge';

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
  const { unreadConversations, unreadClubs, markClubMessagesAsRead } = useUnreadMessages();

  // Mark club messages as read when a club is selected and the clubs tab is active
  useEffect(() => {
    if (activeTab === "clubs" && selectedClub) {
      markClubMessagesAsRead(selectedClub.id);
    }
  }, [activeTab, selectedClub, markClubMessagesAsRead]);

  // Force re-render when unread messages change
  const hasUnreadClubs = unreadClubs.size > 0;
  const hasUnreadConversations = unreadConversations.size > 0;

  return (
    <div className="px-4 py-2 border-b">
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "clubs" | "dm")}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="clubs" className="inline-flex items-center gap-2 relative">
            Club Chat
            {hasUnreadClubs && (
              <Badge variant="destructive" className="h-2 w-2 p-0 absolute -top-1 -right-1 rounded-full" />
            )}
          </TabsTrigger>
          <TabsTrigger value="dm" className="inline-flex items-center gap-2 relative">
            Direct Messages
            {hasUnreadConversations && (
              <Badge variant="destructive" className="h-2 w-2 p-0 absolute -top-1 -right-1 rounded-full" />
            )}
          </TabsTrigger>
        </TabsList>
      </Tabs>
    </div>
  );
};

export default DrawerHeader;
