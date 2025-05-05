
import React, { useEffect, useState } from 'react';
import { MessageCircle } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import UserAvatar from '../shared/UserAvatar';
import Button from '../shared/Button';
import NotificationPopover from '../shared/NotificationPopover';
import { useChatDrawerGlobal } from '@/context/ChatDrawerContext';
import { useUnreadMessages } from '@/context/UnreadMessagesContext';

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
  const { totalUnreadCount } = useUnreadMessages();
  const [badgeCount, setBadgeCount] = useState(totalUnreadCount);
  
  console.log("[HomeHeader] Rendering with notifications:", 
    notifications.length, notifications);
  
  // Update badge count when totalUnreadCount changes
  useEffect(() => {
    setBadgeCount(totalUnreadCount);
  }, [totalUnreadCount]);
  
  // Listen for unreadMessagesUpdated event to update badge count
  useEffect(() => {
    const handleUnreadMessagesUpdated = () => {
      setTimeout(() => {
        // This will trigger a re-render that will pick up the latest totalUnreadCount
        setBadgeCount(prev => prev); // Force an update
      }, 100);
    };
    
    window.addEventListener('unreadMessagesUpdated', handleUnreadMessagesUpdated);
    
    return () => {
      window.removeEventListener('unreadMessagesUpdated', handleUnreadMessagesUpdated);
    };
  }, []);
  
  const handleViewOwnProfile = () => {
    if (currentUser) {
      setSelectedUser(currentUser);
      setCurrentView('profile');
    }
  };

  return (
    <div className="flex items-center justify-between mb-6">
      <h1 className="text-2xl font-bold">Current Matches</h1>
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
