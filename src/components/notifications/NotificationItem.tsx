
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
    if (notification.clubId && notification.clubName) {
      navigateToClub({ id: notification.clubId, name: notification.clubName });
      
      // Mark as read when clicked
      if (onMarkAsRead && !notification.read) {
        onMarkAsRead(notification.id);
      }
    }
  };

  // Handle user name clicks
  const handleUserClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (notification.userId && notification.userName) {
      onUserClick(notification.userId, notification.userName);
      
      // Mark as read when clicked
      if (onMarkAsRead && !notification.read) {
        onMarkAsRead(notification.id);
      }
    }
  };

  const handleJoinClub = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onJoinClub && notification.clubId && notification.clubName) {
      onJoinClub(notification.clubId, notification.clubName);
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

  // Create a formatted message with clickable parts
  const formatMessage = () => {
    let message = notification.message || '';
    
    // For join requests
    if (notification.type === 'join_request' && notification.userName && notification.clubName) {
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
    
    // For club invitations
    if (notification.type === 'invitation' && notification.clubName) {
      return (
        <p className="text-sm">
          {notification.userName && (
            <>
              <span 
                className="font-medium text-primary cursor-pointer hover:underline"
                onClick={handleUserClick}
              >
                {notification.userName}
              </span>
              {' has invited you to join '}
            </>
          )}
          {!notification.userName && 'You\'ve been invited to join '}
          <span 
            className="font-medium text-primary cursor-pointer hover:underline"
            onClick={handleClubClick}
          >
            {notification.clubName}
          </span>
        </p>
      );
    }
    
    // For added to club notifications
    if (notification.type === 'added_to_club' && notification.clubName) {
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
    
    // Generic notification with club reference
    if (notification.clubName && notification.clubId) {
      // Find the club name in the message and make it clickable
      const parts = message.split(notification.clubName);
      if (parts.length > 1) {
        return (
          <p className="text-sm">
            {parts[0]}
            <span 
              className="font-medium text-primary cursor-pointer hover:underline"
              onClick={handleClubClick}
            >
              {notification.clubName}
            </span>
            {parts.slice(1).join(notification.clubName)}
          </p>
        );
      }
    }
    
    // Default message without formatting
    return <p className="text-sm">{message}</p>;
  };

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
        
        {notification.type === 'join_request' && (
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

        {notification.type === 'invitation' && (
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
              Decline
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
