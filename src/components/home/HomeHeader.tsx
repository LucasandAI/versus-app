
import React, { useEffect, useState, useCallback, useRef } from 'react';
import { MessageCircle } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import UserAvatar from '../shared/UserAvatar';
import Button from '../shared/Button';
import NotificationPopover from '../shared/NotificationPopover';
import { useChatDrawerGlobal } from '@/context/ChatDrawerContext';
import { useUnreadMessages } from '@/context/unread-messages';

interface HomeHeaderProps {
  notifications: any[];
  onMarkAsRead: (id: string) => void;
  onClearAll: () => void;
  onUserClick: (userId: string, name: string) => void;
  onDeclineInvite: (id: string) => void;
}

const HomeHeader: React.FC<HomeHeaderProps> = ({
  notifications,
  onMarkAsRead,
  onClearAll,
  onUserClick,
  onDeclineInvite,
}) => {
  const { setCurrentView, currentUser, setSelectedUser } = useApp();
  const { open } = useChatDrawerGlobal();
  const { totalUnreadCount, forceRefresh } = useUnreadMessages();
  const [badgeCount, setBadgeCount] = useState(totalUnreadCount);
  const badgeCountRef = useRef(totalUnreadCount);
  
  console.log("[HomeHeader] Rendering with notifications:", 
    notifications.length, notifications, "unread count:", totalUnreadCount);
  
  // Update badge count when totalUnreadCount changes
  useEffect(() => {
    if (totalUnreadCount !== badgeCountRef.current) {
      console.log("[HomeHeader] Total unread count changed:", totalUnreadCount);
      setBadgeCount(totalUnreadCount);
      badgeCountRef.current = totalUnreadCount;
    }
  }, [totalUnreadCount]);
  
  // Listen for unreadMessagesUpdated event to update badge count
  useEffect(() => {
    const handleUnreadMessagesUpdated = useCallback(() => {
      console.log("[HomeHeader] Unread messages updated event received");
      setTimeout(() => {
        forceRefresh();
      }, 10);
    }, [forceRefresh]);
    
    const handleClubMessageReceived = useCallback((event: CustomEvent) => {
      console.log("[HomeHeader] Club message received for club:", event.detail?.clubId);
      forceRefresh();
    }, [forceRefresh]);
    
    window.addEventListener('unreadMessagesUpdated', handleUnreadMessagesUpdated);
    window.addEventListener('clubMessageReceived', handleClubMessageReceived as EventListener);
    
    return () => {
      window.removeEventListener('unreadMessagesUpdated', handleUnreadMessagesUpdated);
      window.removeEventListener('clubMessageReceived', handleClubMessageReceived as EventListener);
    };
  }, [forceRefresh]);
  
  const handleViewOwnProfile = () => {
    if (currentUser) {
      setSelectedUser(currentUser);
      setCurrentView('profile');
    }
  };

  return (
    <div className="flex items-center justify-between mb-6">
      <h1 className="text-2xl font-bold">My Clubs</h1>
      <div className="flex items-center gap-2">
        <NotificationPopover 
          notifications={notifications}
          onMarkAsRead={onMarkAsRead}
          onClearAll={onClearAll}
          onUserClick={onUserClick}
          onDeclineInvite={onDeclineInvite}
        />
        <Button 
          variant="link"
          onClick={open}
          className="text-primary hover:bg-gray-100 rounded-full p-2"
          icon={<MessageCircle className="h-5 w-5" />}
          badge={badgeCount > 0 ? badgeCount : 0}
        />
        <UserAvatar 
          name={currentUser?.name || "User"} 
          image={currentUser?.avatar} 
          size="sm"
          onClick={handleViewOwnProfile}
        />
      </div>
    </div>
  );
};

export default HomeHeader;
