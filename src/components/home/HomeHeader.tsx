
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
  const [updateTrigger, setUpdateTrigger] = useState(0);
  
  console.log("[HomeHeader] Rendering with notifications:", 
    notifications.length, notifications);
  
  // Listen for unreadMessagesUpdated event to update badge count
  useEffect(() => {
    const handleUnreadMessagesUpdated = () => {
      setUpdateTrigger(prev => prev + 1);
    };
    
    window.addEventListener('unreadMessagesUpdated', handleUnreadMessagesUpdated);
    window.addEventListener('dmMessageReceived', handleUnreadMessagesUpdated);
    window.addEventListener('clubMessageReceived', handleUnreadMessagesUpdated);
    
    return () => {
      window.removeEventListener('unreadMessagesUpdated', handleUnreadMessagesUpdated);
      window.removeEventListener('dmMessageReceived', handleUnreadMessagesUpdated);
      window.removeEventListener('clubMessageReceived', handleUnreadMessagesUpdated);
    };
  }, []);
  
  const handleViewOwnProfile = () => {
    if (currentUser) {
      setSelectedUser(currentUser);
      setCurrentView('profile');
    }
  };

  // Use updateTrigger to force re-render when unread counts change
  console.log(`[HomeHeader] Rendering with totalUnreadCount: ${totalUnreadCount}, updateTrigger: ${updateTrigger}`);

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
          badge={totalUnreadCount > 0 ? totalUnreadCount : 0}
          key={`chat-button-${updateTrigger}-${totalUnreadCount}`}
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

export default React.memo(HomeHeader);
