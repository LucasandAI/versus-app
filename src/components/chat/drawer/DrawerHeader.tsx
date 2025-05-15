import React, { useEffect, memo, useState } from 'react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useUnreadMessages } from '@/context/unread-messages';
import { Club } from '@/types';
import { useMessageReadStatus } from '@/hooks/chat/useMessageReadStatus';
import { useApp } from '@/context/AppContext';

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
  const { unreadClubs, unreadConversations } = useUnreadMessages();
  const { markClubMessagesAsRead } = useMessageReadStatus();
  const { currentUser } = useApp();

  // Directly mark club messages as read when a club is selected and the clubs tab is active
  useEffect(() => {
    if (activeTab === "clubs" && selectedClub && currentUser) {
      console.log(`[DrawerHeader] Marking club ${selectedClub.id} messages as read`);
      
      // Mark the club as active to prevent new unread notifications
      window.dispatchEvent(new CustomEvent('clubActive', { 
        detail: { clubId: selectedClub.id } 
      }));
      
      // Mark messages as read
      markClubMessagesAsRead(selectedClub.id, currentUser.id);
    }
  }, [activeTab, selectedClub, markClubMessagesAsRead, currentUser]);
  
  // Listen for unread message updates to ensure badge is accurate
  const [clubsHaveUnread, setClubsHaveUnread] = useState(unreadClubs && unreadClubs.size > 0);
  const [dmsHaveUnread, setDmsHaveUnread] = useState(unreadConversations && unreadConversations.size > 0);
  
  useEffect(() => {
    setClubsHaveUnread(unreadClubs && unreadClubs.size > 0);
    setDmsHaveUnread(unreadConversations && unreadConversations.size > 0);
    
    const handleUnreadUpdated = () => {
      setClubsHaveUnread(unreadClubs && unreadClubs.size > 0);
      setDmsHaveUnread(unreadConversations && unreadConversations.size > 0);
    };
    
    window.addEventListener('unreadMessagesUpdated', handleUnreadUpdated);
    window.addEventListener('messagesMarkedAsRead', handleUnreadUpdated);
    
    return () => {
      window.removeEventListener('unreadMessagesUpdated', handleUnreadUpdated);
      window.removeEventListener('messagesMarkedAsRead', handleUnreadUpdated);
    };
  }, [unreadClubs, unreadConversations]);
  
  // Use useState for stable rendering of unread indicators
  const clubsUnreadBadge = clubsHaveUnread ? (
    <span className="h-2 w-2 bg-red-500 rounded-full inline-block ml-1" data-testid="club-unread-badge"></span>
  ) : null;

  const dmUnreadBadge = dmsHaveUnread ? (
    <span className="h-2 w-2 bg-red-500 rounded-full inline-block ml-1" data-testid="dm-unread-badge"></span>
  ) : null;
  
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
