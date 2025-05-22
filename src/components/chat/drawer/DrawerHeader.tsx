
import React, { useEffect, memo } from 'react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useUnreadMessages } from '@/context/unread-messages';
import { Club } from '@/types';
import { Badge } from '@/components/ui/badge';
import { useMessageReadStatus } from '@/hooks/chat/useMessageReadStatus';

interface DrawerHeaderProps {
  activeTab: "clubs" | "dm";
  setActiveTab: (tab: "clubs" | "dm") => void;
  selectedClub: Club | null;
}

// Memoize the header to prevent re-renders when the drawer content updates
const DrawerHeader: React.FC<DrawerHeaderProps> = memo(({ 
  activeTab, 
  setActiveTab,
  selectedClub 
}) => {
  const { unreadClubs, unreadConversations, markClubMessagesAsRead } = useUnreadMessages();
  const { markClubMessagesAsRead: markClubRead } = useMessageReadStatus();

  // Mark club messages as read when a club is selected and the clubs tab is active
  useEffect(() => {
    if (activeTab === "clubs" && selectedClub) {
      console.log(`[DrawerHeader] Marking club ${selectedClub.id} messages as read (selectedClub present and clubs tab active)`);
      // Use our enhanced function that also updates local storage
      markClubRead(selectedClub.id, true);
    }
  }, [activeTab, selectedClub, markClubRead]);
  
  // Use useMemo for stable rendering of unread indicators
  const clubsUnreadBadge = React.useMemo(() => {
    const count = unreadClubs.size;
    return count > 0 ? (
      <Badge variant="dot" className="ml-1" />
    ) : null;
  }, [unreadClubs]);

  const dmUnreadBadge = React.useMemo(() => {
    const count = unreadConversations.size;
    return count > 0 ? (
      <Badge variant="dot" className="ml-1" />
    ) : null;
  }, [unreadConversations]);
  
  return (
    <div className="px-4 py-2 border-b">
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "clubs" | "dm")}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="clubs" className="inline-flex items-center justify-center gap-2">
            Club Chat
            {clubsUnreadBadge}
          </TabsTrigger>
          <TabsTrigger value="dm" className="inline-flex items-center justify-center gap-2">
            Direct Messages
            {dmUnreadBadge}
          </TabsTrigger>
        </TabsList>
      </Tabs>
    </div>
  );
});

DrawerHeader.displayName = 'DrawerHeader';

export default DrawerHeader;
