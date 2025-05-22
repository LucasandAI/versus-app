
import React, { useEffect, memo, useState } from 'react';
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
  const { unreadClubs, unreadConversations, fetchUnreadCounts } = useUnreadMessages();
  const { markClubMessagesAsRead } = useMessageReadStatus();
  const [forceRender, setForceRender] = useState(0);
  
  // Listen for unread status changes to update badges
  useEffect(() => {
    const handleUnreadUpdate = () => {
      console.log('[DrawerHeader] Unread status changed, forcing re-render');
      setForceRender(prev => prev + 1);
    };
    
    // Listen for various events that might affect unread status
    window.addEventListener('unread-status-changed', handleUnreadUpdate);
    window.addEventListener('unreadMessagesUpdated', handleUnreadUpdate);
    window.addEventListener('local-read-status-change', handleUnreadUpdate);
    window.addEventListener('club-message-received', handleUnreadUpdate);
    window.addEventListener('message-sent', handleUnreadUpdate);
    
    // Refresh unread counts when component mounts
    fetchUnreadCounts();
    
    return () => {
      window.removeEventListener('unread-status-changed', handleUnreadUpdate);
      window.removeEventListener('unreadMessagesUpdated', handleUnreadUpdate);
      window.removeEventListener('local-read-status-change', handleUnreadUpdate);
      window.removeEventListener('club-message-received', handleUnreadUpdate);
      window.removeEventListener('message-sent', handleUnreadUpdate);
    };
  }, [fetchUnreadCounts]);

  // Mark club messages as read when a club is selected and the clubs tab is active
  useEffect(() => {
    if (activeTab === "clubs" && selectedClub) {
      console.log(`[DrawerHeader] Marking club ${selectedClub.id} messages as read (selectedClub present and clubs tab active)`);
      // Use our enhanced function that also updates local storage
      markClubMessagesAsRead(selectedClub.id, true);
    }
  }, [activeTab, selectedClub, markClubMessagesAsRead]);
  
  // Use useMemo for stable rendering of unread indicators
  const clubsUnreadBadge = React.useMemo(() => {
    const count = unreadClubs.size;
    return count > 0 ? (
      <Badge variant="dot" className="ml-1" />
    ) : null;
  }, [unreadClubs, forceRender]); // Include forceRender to ensure updates

  const dmUnreadBadge = React.useMemo(() => {
    const count = unreadConversations.size;
    return count > 0 ? (
      <Badge variant="dot" className="ml-1" />
    ) : null;
  }, [unreadConversations, forceRender]); // Include forceRender to ensure updates
  
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
