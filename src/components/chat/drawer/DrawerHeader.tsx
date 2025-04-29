
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

  return (
    <div className="px-4 py-2 border-b">
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "clubs" | "dm")}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="clubs" className="inline-flex items-center justify-center gap-2">
            Club Chat
            {unreadClubs.size > 0 && (
              <Badge variant="destructive" className="h-4 w-4 p-0 flex items-center justify-center text-[9px] rounded-full">
                {unreadClubs.size}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="dm" className="inline-flex items-center justify-center gap-2">
            Direct Messages
            {unreadConversations.size > 0 && (
              <Badge variant="destructive" className="h-4 w-4 p-0 flex items-center justify-center text-[9px] rounded-full">
                {unreadConversations.size}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>
      </Tabs>
    </div>
  );
};

export default DrawerHeader;
