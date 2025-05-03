
import React, { useEffect, useState, memo } from 'react';
import { Club } from '@/types';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useUnreadMessages } from '@/context/unread-messages';
import { Badge } from '@/components/ui/badge';

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
  const { unreadConversations, unreadClubs, markClubMessagesAsRead, totalUnreadCount } = useUnreadMessages();
  const [updateTrigger, setUpdateTrigger] = useState(0);

  // Force re-render when unread state changes
  useEffect(() => {
    const handleUnreadChanged = () => {
      setUpdateTrigger(prev => prev + 1);
    };
    
    window.addEventListener('unreadMessagesUpdated', handleUnreadChanged);
    window.addEventListener('clubMessageReceived', handleUnreadChanged);
    window.addEventListener('dmMessageReceived', handleUnreadChanged);
    
    return () => {
      window.removeEventListener('unreadMessagesUpdated', handleUnreadChanged);
      window.removeEventListener('clubMessageReceived', handleUnreadChanged);
      window.removeEventListener('dmMessageReceived', handleUnreadChanged);
    };
  }, []);

  // Mark club messages as read when a club is selected and the clubs tab is active
  useEffect(() => {
    if (activeTab === "clubs" && selectedClub) {
      console.log(`[DrawerHeader] Marking club ${selectedClub.id} messages as read (selectedClub present and clubs tab active)`);
      markClubMessagesAsRead(selectedClub.id);
    }
  }, [activeTab, selectedClub, markClubMessagesAsRead]);
  
  // Get current unread counts - force recomputation on update trigger
  const clubsUnreadCount = unreadClubs.size;
  const dmsUnreadCount = unreadConversations.size;
  
  // Use updateTrigger in the component's render to force re-render
  console.log(`[DrawerHeader] Rendering with updateTrigger: ${updateTrigger}, club unread: ${clubsUnreadCount}, dm unread: ${dmsUnreadCount}`);
  
  return (
    <div className="px-4 py-2 border-b">
      <Tabs 
        value={activeTab} 
        onValueChange={(v) => setActiveTab(v as "clubs" | "dm")}
        key={`tabs-${updateTrigger}`}
      >
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="clubs" className="inline-flex items-center justify-center gap-2">
            Club Chat
            {clubsUnreadCount > 0 && (
              <Badge 
                variant="dot" 
                className="!inline-block !visible" 
              />
            )}
          </TabsTrigger>
          <TabsTrigger value="dm" className="inline-flex items-center justify-center gap-2">
            Direct Messages
            {dmsUnreadCount > 0 && (
              <Badge 
                variant="dot" 
                className="!inline-block !visible" 
              />
            )}
          </TabsTrigger>
        </TabsList>
      </Tabs>
    </div>
  );
});

DrawerHeader.displayName = 'DrawerHeader';

export default DrawerHeader;
