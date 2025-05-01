
import React, { useEffect } from 'react';
import { Notification } from '@/types';
import { cn } from '@/lib/utils';
import { useNavigation } from '@/hooks/useNavigation';
import { Button } from '@/components/ui/button';

interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead?: (id: string) => void;
  onUserClick: (userId: string, userName: string) => void;
  onJoinClub?: (clubId: string, clubName: string, requesterId: string) => void;
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
    const clubId = notification.data?.clubId || notification.clubId;
    const clubName = notification.data?.clubName || notification.clubName;
    
    if (clubId && clubName) {
      navigateToClub({ id: clubId, name: clubName });
      
      // Mark as read when clicked
      if (onMarkAsRead && !notification.read) {
        onMarkAsRead(notification.id);
      }
    }
  };

  // Handle user name clicks
  const handleUserClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const userId = notification.data?.requesterId || notification.userId;
    const userName = notification.data?.requesterName || notification.userName;
    
    if (userId && userName) {
      onUserClick(userId, userName);
      
      // Mark as read when clicked
      if (onMarkAsRead && !notification.read) {
        onMarkAsRead(notification.id);
      }
    }
  };

  const handleJoinClub = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onJoinClub && notification.type === 'join_request') {
      const clubId = notification.data?.clubId || notification.clubId;
      const clubName = notification.data?.clubName || notification.clubName;
      const requesterId = notification.data?.requesterId || notification.userId;
      
      console.log("[NotificationItem] Accept join request with data:", {
        clubId, 
        clubName, 
        requesterId, 
        notificationData: notification.data
      });
      
      if (clubId && clubName && requesterId) {
        onJoinClub(clubId, clubName, requesterId);
      }
    }
  };

  const handleDeclineInvite = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDeclineInvite) {
      console.log("[NotificationItem] Declining notification:", notification.id);
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
    if (notification.type === 'join_request' && notification.data?.requesterName && notification.data?.clubName) {
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
    
    // For accepted join requests notifications
    if (notification.type === 'request_accepted' && notification.data?.clubName) {
      return (
        <p className="text-sm">
          {'You\'ve been added to '}
          <span 
            className="font-medium text-primary cursor-pointer hover:underline"
            onClick={handleClubClick}
          >
            {notification.data.clubName}
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
