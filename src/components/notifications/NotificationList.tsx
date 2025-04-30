
import React from 'react';
import { Button } from '@/components/ui/button';
import { NotificationItem } from './NotificationItem';
import { Notification } from '@/types';

interface NotificationListProps {
  notifications: Notification[];
  onUserClick: (userId: string, userName: string) => void;
  onJoinClub?: (clubId: string, clubName: string) => void;
  onDeclineInvite?: (id: string) => void;
  onClearAll: () => void;
  formatTime: (timestamp: string) => string;
}

export const NotificationList: React.FC<NotificationListProps> = ({
  notifications,
  onUserClick,
  onJoinClub,
  onDeclineInvite,
  onClearAll,
  formatTime,
}) => {
  console.log("[NotificationList] Rendering with notifications:", notifications.length, notifications);

  // Sort notifications by read status (unread first) and then by timestamp (newest first)
  const sortedNotifications = [...notifications].sort((a, b) => {
    // First sort by read status (unread first)
    if (a.read !== b.read) {
      return a.read ? 1 : -1;
    }
    // Then sort by timestamp (newest first)
    return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
  });

  if (sortedNotifications.length === 0) {
    return (
      <div className="p-4 text-center text-gray-500">
        No notifications
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center justify-between p-4 border-b">
        <h3 className="font-medium">Notifications</h3>
        <Button 
          variant="link" 
          size="sm" 
          onClick={onClearAll}
          className="text-xs text-gray-500 hover:text-gray-900 p-0 h-auto"
        >
          Clear all
        </Button>
      </div>
      
      <div className="max-h-[400px] overflow-y-auto">
        {sortedNotifications.map(notification => (
          <NotificationItem
            key={notification.id}
            notification={notification}
            onUserClick={onUserClick}
            onJoinClub={onJoinClub}
            onDeclineInvite={onDeclineInvite}
            formatTime={formatTime}
          />
        ))}
      </div>
    </>
  );
};
