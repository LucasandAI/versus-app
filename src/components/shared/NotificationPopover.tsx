
import React, { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import Button from './Button';
import UserAvatar from './UserAvatar';

interface Notification {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  clubId: string;
  clubName: string;
  distance: number;
  timestamp: string;
  read: boolean;
}

interface NotificationPopoverProps {
  notifications: Notification[];
  onMarkAsRead: (id: string) => void;
  onClearAll: () => void;
  onUserClick: (userId: string, userName: string) => void;
}

const NotificationPopover: React.FC<NotificationPopoverProps> = ({
  notifications,
  onMarkAsRead,
  onClearAll,
  onUserClick
}) => {
  const [open, setOpen] = useState(false);
  
  const unreadCount = notifications.filter(n => !n.read).length;
  
  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    // Mark all as read when opening the popover instead of closing
    if (isOpen && unreadCount > 0) {
      notifications.forEach(n => {
        if (!n.read) onMarkAsRead(n.id);
      });
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    
    return date.toLocaleDateString();
  };

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <button className="relative text-primary hover:bg-gray-100 rounded-full p-2">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 h-4 w-4 text-[10px] flex items-center justify-center bg-red-500 text-white rounded-full">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-medium">Notifications</h3>
          {notifications.length > 0 && (
            <Button 
              variant="link" 
              size="sm" 
              onClick={onClearAll}
              className="text-xs text-gray-500 hover:text-gray-900 p-0 h-auto"
            >
              Clear all
            </Button>
          )}
        </div>
        
        <div className="max-h-[300px] overflow-y-auto">
          {notifications.length > 0 ? (
            notifications.map(notification => (
              <div 
                key={notification.id} 
                className={`p-3 border-b hover:bg-gray-50 transition-colors ${!notification.read ? 'bg-blue-50' : ''}`}
              >
                <div className="flex items-start gap-3">
                  <UserAvatar 
                    name={notification.userName} 
                    image={notification.userAvatar} 
                    size="sm"
                    className="cursor-pointer mt-1"
                    onClick={() => {
                      onUserClick(notification.userId, notification.userName);
                      setOpen(false);
                    }}
                  />
                  
                  <div className="flex-1">
                    <p className="text-sm">
                      <span 
                        className="font-medium cursor-pointer hover:text-primary"
                        onClick={() => {
                          onUserClick(notification.userId, notification.userName);
                          setOpen(false);
                        }}
                      >
                        {notification.userName}
                      </span>
                      {' '}added{' '}
                      <span className="font-medium">{notification.distance.toFixed(1)}km</span>
                      {' '}to{' '}
                      <span className="font-medium">{notification.clubName}</span>
                    </p>
                    <span className="text-xs text-gray-500">{formatTime(notification.timestamp)}</span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="p-4 text-center text-gray-500">
              No notifications
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default NotificationPopover;
