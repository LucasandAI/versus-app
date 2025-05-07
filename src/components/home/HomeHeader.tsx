
import React, { useEffect, useState } from 'react';
import { MessageCircle, Watch } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import UserAvatar from '../shared/UserAvatar';
import Button from '../shared/Button';
import NotificationPopover from '../shared/NotificationPopover';
import { useChatDrawerGlobal } from '@/context/ChatDrawerContext';
import { useUnreadMessages } from '@/context/UnreadMessagesContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useNavigate } from 'react-router-dom';

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
  onDeclineInvite
}) => {
  const {
    setCurrentView,
    currentUser,
    setSelectedUser
  } = useApp();
  
  const {
    open
  } = useChatDrawerGlobal();
  
  const {
    totalUnreadCount
  } = useUnreadMessages();
  
  const navigate = useNavigate();
  
  const [badgeCount, setBadgeCount] = useState(totalUnreadCount);
  const [notificationsCount, setNotificationsCount] = useState(notifications.length);
  
  console.log("[HomeHeader] Rendering with notifications:", notifications.length, notifications);

  // Update badge count when totalUnreadCount changes
  useEffect(() => {
    setBadgeCount(totalUnreadCount);
  }, [totalUnreadCount]);
  
  // Update notifications count when notifications array changes
  useEffect(() => {
    setNotificationsCount(notifications.length);
  }, [notifications]);

  // Listen for unreadMessagesUpdated event to update badge count
  useEffect(() => {
    const handleUnreadMessagesUpdated = () => {
      setTimeout(() => {
        // This will trigger a re-render that will pick up the latest totalUnreadCount
        setBadgeCount(prev => {
          console.log("[HomeHeader] Updating badge count to:", totalUnreadCount);
          return totalUnreadCount;
        });
      }, 100);
    };
    
    const handleNotificationsUpdated = () => {
      setTimeout(() => {
        setNotificationsCount(notifications.length);
      }, 100);
    };
    
    window.addEventListener('unreadMessagesUpdated', handleUnreadMessagesUpdated);
    window.addEventListener('notificationsUpdated', handleNotificationsUpdated);
    
    return () => {
      window.removeEventListener('unreadMessagesUpdated', handleUnreadMessagesUpdated);
      window.removeEventListener('notificationsUpdated', handleNotificationsUpdated);
    };
  }, [notifications.length, totalUnreadCount]);
  
  const handleViewOwnProfile = () => {
    if (currentUser) {
      setSelectedUser(currentUser);
      setCurrentView('profile');
    }
  };
  
  const handleConnectDevice = () => {
    navigate('/connect-device');
  };
  
  return (
    <div className="flex items-center justify-between mb-6">
      <h1 className="text-2xl font-bold">Versus</h1>
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
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <div className="cursor-pointer">
              <UserAvatar 
                name={currentUser?.name || "User"} 
                image={currentUser?.avatar} 
                size="sm"
              />
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={handleViewOwnProfile}>
              <span>Visit Profile</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleConnectDevice}>
              <Watch className="mr-2 h-4 w-4" />
              <span>Connect a Device</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};

export default HomeHeader;
