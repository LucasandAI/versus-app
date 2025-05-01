
import React, { useEffect } from 'react';
import { Notification } from '@/types';
import { cn } from '@/lib/utils';
import { useNavigation } from '@/hooks/useNavigation';
import { Button } from '@/components/ui/button';

interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead?: (id: string) => void;
  onUserClick: (userId: string, userName: string) => void;
  onJoinClub?: (clubId: string, clubName: string) => void;
  onDeclineInvite?: (id: string) => void;
  formatTime: (timestamp: string) => string;
}

export const NotificationItem: React.FC<NotificationItemProps> = ({
  notification,
  onMarkAsRead,
  onUserClick,
  onJoinClub,
  onDeclineInvite,
  formatTime,
}) => {
  const { navigateToClub } = useNavigation();

  useEffect(() => {
    console.log("[NotificationItem] Rendering notification:", notification);
  }, [notification]);

  // Handle club name clicks
  const handleClubClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    // First check if we have data in the new format
    if (notification.data?.clubId && notification.data?.clubName) {
      navigateToClub({ id: notification.data.clubId, name: notification.data.clubName });
    }
    // Fallback to old format
    else if (notification.clubId && notification.clubName) {
      navigateToClub({ id: notification.clubId, name: notification.clubName });
    }
    
    // Mark as read when clicked
    if (onMarkAsRead && !notification.read) {
      onMarkAsRead(notification.id);
    }
  };

  // Handle user name clicks
  const handleUserClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    // First check if we have data in the new format
    if (notification.data?.requesterId && notification.data?.requesterName) {
      onUserClick(notification.data.requesterId, notification.data.requesterName);
    }
    // Fallback to old format
    else if (notification.userId && notification.userName) {
      onUserClick(notification.userId, notification.userName);
    }
    
    // Mark as read when clicked
    if (onMarkAsRead && !notification.read) {
      onMarkAsRead(notification.id);
    }
  };

  const handleJoinClub = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onJoinClub) {
      // Use data from the new format if available
      if (notification.data?.requesterId && notification.data?.clubId) {
        onJoinClub(notification.data.requesterId, notification.data.clubId);
      }
      // Fallback to old format
      else if (notification.clubId && notification.userId) {
        onJoinClub(notification.userId, notification.clubId);
      }
    }
  };

  const handleDeclineInvite = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDeclineInvite) {
      onDeclineInvite(notification.id);
    }
  };

  // Determine notification styling
  const isNewNotification = !notification.read;
  const backgroundClass = cn(
    "p-3 border-b hover:bg-gray-50 transition-colors",
    isNewNotification && "bg-blue-50"
  );

  if (!notification || !notification.message) {
    console.error("[NotificationItem] Invalid notification object:", notification);
    return null;
  }

  // Create a formatted message with clickable parts based on notification type
  const formatMessage = () => {
    // For join requests - what admins see when users request to join their club
    if (notification.type === 'join_request') {
      // Use the new data format
      if (notification.data?.requesterName && notification.data?.clubName) {
        return (
          <p className="text-sm">
            <span 
              className="font-medium text-primary cursor-pointer hover:underline"
              onClick={handleUserClick}
            >
              {notification.data.requesterName}
            </span>
            {' has requested to join '}
            <span 
              className="font-medium text-primary cursor-pointer hover:underline"
              onClick={handleClubClick}
            >
              {notification.data.clubName}
            </span>
          </p>
        );
      }
      // Fallback to old format
      else if (notification.userName && notification.clubName) {
        return (
          <p className="text-sm">
            <span 
              className="font-medium text-primary cursor-pointer hover:underline"
              onClick={handleUserClick}
            >
              {notification.userName}
            </span>
            {' has requested to join '}
            <span 
              className="font-medium text-primary cursor-pointer hover:underline"
              onClick={handleClubClick}
            >
              {notification.clubName}
            </span>
          </p>
        );
      }
    }
    
    // For accepted join requests notifications
    if (notification.type === 'request_accepted' && notification.clubName) {
      return (
        <p className="text-sm">
          {'You\'ve been added to '}
          <span 
            className="font-medium text-primary cursor-pointer hover:underline"
            onClick={handleClubClick}
          >
            {notification.clubName}
          </span>
        </p>
      );
    }
    
    // Default message without formatting
    return <p className="text-sm">{notification.message}</p>;
  };

  // Only show action buttons for join_request notifications (when you're the club admin)
  const showActionButtons = notification.type === 'join_request';

  return (
    <div 
      className={backgroundClass} 
      onClick={() => {
        if (onMarkAsRead && !notification.read) {
          onMarkAsRead(notification.id);
        }
      }}
    >
      <div className="flex flex-col gap-2">
        <div className="flex items-start justify-between">
          {formatMessage()}
          <span className="text-xs text-gray-500 ml-2 whitespace-nowrap">
            {formatTime(notification.timestamp)}
          </span>
        </div>
        
        {/* Only show buttons for join requests */}
        {showActionButtons && (
          <div className="flex gap-2 mt-1">
            <Button 
              onClick={handleJoinClub}
              size="sm"
              className="px-3 py-1 bg-primary text-white text-xs rounded h-7"
            >
              Accept
            </Button>
            <Button 
              onClick={handleDeclineInvite}
              size="sm"
              variant="outline"
              className="px-3 py-1 text-xs rounded h-7"
            >
              Deny
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
