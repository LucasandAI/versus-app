
import React, { useEffect, memo, useState, useCallback } from 'react';
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
  const [clubsWithUnread, setClubsWithUnread] = useState<Set<string>>(new Set());
  const [dmsWithUnread, setDmsWithUnread] = useState<Set<string>>(new Set());
  
  // Sync with context on mount and when unread collections change
  useEffect(() => {
    setClubsWithUnread(new Set(unreadClubs));
    setDmsWithUnread(new Set(unreadConversations));
  }, [unreadClubs, unreadConversations]);
  
  // Handle force updates more efficiently with a dedicated function
  const handleUnreadUpdate = useCallback(() => {
    console.log('[DrawerHeader] Unread status changed, forcing re-render');
    setForceRender(prev => prev + 1);
    
    // Also update our local copies of the unread sets
    setClubsWithUnread(new Set(unreadClubs));
    setDmsWithUnread(new Set(unreadConversations));
  }, [unreadClubs, unreadConversations]);
  
  // Handle specific conversation opened event
  const handleConversationOpened = useCallback((event: CustomEvent) => {
    console.log('[DrawerHeader] Conversation opened event received', event.detail);
    const { type, id } = event.detail;
    
    // Update our local copies immediately for instant UI feedback
    if (type === 'club') {
      setClubsWithUnread(prev => {
        const updated = new Set(prev);
        updated.delete(id);
        return updated;
      });
    } else if (type === 'dm') {
      setDmsWithUnread(prev => {
        const updated = new Set(prev);
        updated.delete(id);
        return updated;
      });
    }
    
    // Force re-render to update badges
    setForceRender(prev => prev + 1);
  }, []);
  
  // Listen for unread status changes to update badges
  useEffect(() => {
    // Listen for various events that might affect unread status
    window.addEventListener('unread-status-changed', handleUnreadUpdate);
    window.addEventListener('unreadMessagesUpdated', handleUnreadUpdate);
    window.addEventListener('local-read-status-change', handleUnreadUpdate);
    window.addEventListener('club-message-received', handleUnreadUpdate);
    window.addEventListener('message-sent', handleUnreadUpdate);
    window.addEventListener('badge-refresh-required', handleUnreadUpdate);
    window.addEventListener('club-read-status-changed', handleUnreadUpdate);
    window.addEventListener('dm-read-status-changed', handleUnreadUpdate);
    window.addEventListener('conversation-opened', handleConversationOpened);
    
    // Refresh unread counts when component mounts
    fetchUnreadCounts();
    
    return () => {
      window.removeEventListener('unread-status-changed', handleUnreadUpdate);
      window.removeEventListener('unreadMessagesUpdated', handleUnreadUpdate);
      window.removeEventListener('local-read-status-change', handleUnreadUpdate);
      window.removeEventListener('club-message-received', handleUnreadUpdate);
      window.removeEventListener('message-sent', handleUnreadUpdate);
      window.removeEventListener('badge-refresh-required', handleUnreadUpdate);
      window.removeEventListener('club-read-status-changed', handleUnreadUpdate);
      window.removeEventListener('dm-read-status-changed', handleUnreadUpdate);
      window.removeEventListener('conversation-opened', handleConversationOpened);
    };
  }, [fetchUnreadCounts, handleUnreadUpdate, handleConversationOpened]);

  // Mark club messages as read when a club is selected and the clubs tab is active
  useEffect(() => {
    if (activeTab === "clubs" && selectedClub) {
      console.log(`[DrawerHeader] Marking club ${selectedClub.id} messages as read (selectedClub present and clubs tab active)`);
      // Use our enhanced function that also updates local storage
      markClubMessagesAsRead(selectedClub.id, true);
      
      // Also update our local copy immediately for instant UI feedback
      setClubsWithUnread(prev => {
        const updated = new Set(prev);
        updated.delete(selectedClub.id);
        return updated;
      });
    }
  }, [activeTab, selectedClub, markClubMessagesAsRead]);
  
  // Use useMemo for stable rendering of unread indicators
  const clubsUnreadBadge = React.useMemo(() => {
    const count = clubsWithUnread.size;
    return count > 0 ? (
      <Badge variant="dot" className="ml-1" />
    ) : null;
  }, [clubsWithUnread, forceRender]); // Include forceRender to ensure updates

  const dmUnreadBadge = React.useMemo(() => {
    const count = dmsWithUnread.size;
    return count > 0 ? (
      <Badge variant="dot" className="ml-1" />
    ) : null;
  }, [dmsWithUnread, forceRender]); // Include forceRender to ensure updates
  
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
