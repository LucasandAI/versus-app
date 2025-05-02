
import React from 'react';
import { Notification } from '@/types';
import { NotificationItem } from './NotificationItem';
import { Button } from '../ui/button';

interface NotificationListProps {
  notifications: Notification[];
  onMarkAsRead: (id: string) => void;
  onUserClick: (userId: string, userName: string) => void;
  onDeclineInvite?: (id: string) => void;
  onClearAll: () => void;
  formatTime: (timestamp: string) => string;
  onOptimisticDelete?: (id: string) => void; // New prop for optimistic updates
}

export const NotificationList: React.FC<NotificationListProps> = ({
  notifications,
  onMarkAsRead,
  onUserClick,
  onDeclineInvite,
  onClearAll,
  formatTime,
  onOptimisticDelete,
}) => {
  // Check if there are any unread notifications
  const hasUnread = notifications.some(notification => !notification.read);
  
  // Check if there are any notifications at all
  const isEmpty = notifications.length === 0;

  return (
    <div className="max-h-[80vh] flex flex-col">
      {/* Header with clear all button */}
      <div className="flex items-center justify-between p-3 border-b">
        <h3 className="font-medium">Notifications</h3>
        {hasUnread && (
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-xs text-gray-500 hover:text-gray-900"
            onClick={onClearAll}
          >
            Mark all as read
          </Button>
        )}
      </div>
      
      {/* List of notifications */}
      <div className="overflow-y-auto">
        {isEmpty ? (
          <div className="p-4 text-center text-gray-500">
            No notifications yet
          </div>
        ) : (
          notifications.map((notification) => (
            <NotificationItem
              key={notification.id}
              notification={notification}
              onMarkAsRead={onMarkAsRead}
              onUserClick={onUserClick}
              onDeclineInvite={onDeclineInvite}
              formatTime={formatTime}
              onOptimisticDelete={onOptimisticDelete}
            />
          ))
        )}
      </div>
    </div>
  );
};
