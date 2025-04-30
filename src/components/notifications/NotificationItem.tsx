
import React, { useEffect } from 'react';
import UserAvatar from '@/components/shared/UserAvatar';
import { Notification } from '@/types';
import { useApp } from '@/context/AppContext';
import { findClubFromStorage, getMockClub, handleClubError } from '@/lib/notificationUtils';
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
  const { setSelectedClub, setCurrentView } = useApp();
  const { navigateToUserProfile } = useNavigation();

  useEffect(() => {
    console.log("[NotificationItem] Rendering notification:", notification);
  }, [notification]);

  const handleClubClick = () => {
    if (!notification.clubId) return;
    
    const club = findClubFromStorage(notification.clubId);
    
    if (club) {
      setSelectedClub(club);
      setCurrentView('clubDetail');
    } else {
      // Try to use mock club data
      const mockClub = getMockClub(notification.clubId, notification.clubName || '');
      if (mockClub) {
        setSelectedClub(mockClub);
        setCurrentView('clubDetail');
      } else {
        handleClubError();
      }
    }

    // Mark as read when clicked
    if (onMarkAsRead && !notification.read) {
      onMarkAsRead(notification.id);
    }
  };

  const handleUserItemClick = () => {
    if (notification.userId) {
      navigateToUserProfile(notification.userId, notification.userName || notification.userId, null);
      
      // Mark as read when clicked
      if (onMarkAsRead && !notification.read) {
        onMarkAsRead(notification.id);
      }
    }
  };

  const handleJoinClub = () => {
    if (onJoinClub && notification.clubId && notification.clubName) {
      onJoinClub(notification.clubId, notification.clubName);
    }
  };

  const handleDeclineInvite = () => {
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

  return (
    <div className={backgroundClass} onClick={() => {
      if (onMarkAsRead && !notification.read) {
        onMarkAsRead(notification.id);
      }
    }}>
      <div className="flex items-start gap-3">
        <UserAvatar 
          name={notification.userName || 'User'} 
          image={notification.userAvatar} 
          size="sm"
          className="cursor-pointer mt-1"
          onClick={handleUserItemClick}
        />
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <span 
              className="font-semibold cursor-pointer hover:underline"
              onClick={handleUserItemClick}
            >
              {notification.userName || 'User'}
            </span>
            <span className="text-xs text-gray-500">
              {formatTime(notification.timestamp)}
            </span>
          </div>
          
          <p className="text-sm">
            {notification.message}
          </p>
          
          {notification.type === 'invitation' && (
            <div className="mt-2 flex gap-2">
              <Button 
                onClick={handleJoinClub}
                size="sm"
                className="px-3 py-1 bg-primary text-white text-xs rounded h-auto"
              >
                Accept
              </Button>
              <Button 
                onClick={handleDeclineInvite}
                size="sm"
                variant="outline"
                className="px-3 py-1 text-xs rounded h-auto"
              >
                Decline
              </Button>
            </div>
          )}

          {notification.clubId && notification.clubName && (
            <p 
              className="text-xs text-primary font-medium hover:underline cursor-pointer mt-1"
              onClick={handleClubClick}
            >
              {notification.clubName}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
