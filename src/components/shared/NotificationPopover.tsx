
import React, { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from '@/components/ui/popover';
import { NotificationList } from '../notifications/NotificationList';
import { Notification } from '@/types';

interface NotificationPopoverProps {
  notifications: Notification[];
  onMarkAsRead: (id: string) => void;
  onClearAll: () => void;
  onUserClick: (userId: string, userName: string) => void;
  onJoinClub?: (clubId: string, clubName: string) => void;
  onDeclineInvite?: (notificationId: string) => void;
}

const NotificationPopover: React.FC<NotificationPopoverProps> = ({
  notifications,
  onMarkAsRead,
  onClearAll,
  onUserClick,
  onJoinClub,
  onDeclineInvite
}) => {
  const [open, setOpen] = useState(false);
  const unreadCount = notifications.filter(n => !n.read).length;
  
  // When popover opens, display notifications but don't mark them as read
  // Only track that they've been seen by the user
  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    
    // No automatic marking as read when opening the popover
    // Notifications will remain unread until user interaction
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
      <PopoverContent className="w-80 p-0 max-w-[90vw]" align="end">
        <NotificationList
          notifications={notifications}
          onUserClick={(userId, userName) => {
            // Only mark specific notification as read when user clicks
            // notifications
            //   .filter(n => n.userId === userId && !n.read)
            //   .forEach(n => onMarkAsRead(n.id));
            onUserClick(userId, userName);
          }}
          onJoinClub={(clubId, clubName) => {
            // Only mark as read when user explicitly handles notification
            if (onJoinClub) onJoinClub(clubId, clubName);
          }}
          onDeclineInvite={(id) => {
            if (onDeclineInvite) onDeclineInvite(id);
          }}
          onClearAll={onClearAll}
          formatTime={formatTime}
        />
      </PopoverContent>
    </Popover>
  );
};

export default NotificationPopover;
