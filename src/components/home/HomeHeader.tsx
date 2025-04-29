
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
  onJoinClub: (clubId: string, clubName: string) => void;
  onDeclineInvite: (id: string) => void;
}

const HomeHeader: React.FC<HomeHeaderProps> = ({
  notifications,
  onMarkAsRead,
  onClearAll,
  onUserClick,
  onJoinClub,
  onDeclineInvite,
}) => {
  const { setCurrentView, currentUser, setSelectedUser } = useApp();
  const { open } = useChatDrawerGlobal();
  const { totalUnreadCount, fetchUnreadCounts } = useUnreadMessages();
  
  // Add state to force re-render when unread count changes
  const [unreadCount, setUnreadCount] = useState(totalUnreadCount);
  
  // Update local state when context value changes
  useEffect(() => {
    setUnreadCount(totalUnreadCount);
  }, [totalUnreadCount]);
  
  // Fetch unread counts when component mounts
  useEffect(() => {
    if (currentUser?.id) {
      fetchUnreadCounts();
    }
  }, [currentUser?.id, fetchUnreadCounts]);
  
  // Listen for global unread message updates
  useEffect(() => {
    const handleUnreadMessagesUpdated = () => {
      // Force a re-render by updating local state
      setUnreadCount(count => {
        // We'll get the real count from context in the next effect
        return count;
      });
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
      <h1 className="text-2xl font-bold">My Clubs</h1>
      <div className="flex items-center gap-2">
        <NotificationPopover 
          notifications={notifications}
          onMarkAsRead={onMarkAsRead}
          onClearAll={onClearAll}
          onUserClick={onUserClick}
          onJoinClub={onJoinClub}
          onDeclineInvite={onDeclineInvite}
        />
        <Button 
          variant="link"
          onClick={open}
          className="text-primary hover:bg-gray-100 rounded-full p-2"
          icon={<MessageCircle className="h-5 w-5" />}
          badge={unreadCount > 0 ? unreadCount : 0}
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
