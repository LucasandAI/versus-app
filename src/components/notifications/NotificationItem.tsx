import React from 'react';
import UserAvatar from '@/components/shared/UserAvatar';
import { Notification } from '@/types';
import { useApp } from '@/context/AppContext';
import { findClubFromStorage, getMockClub, handleClubError } from '@/utils/notificationUtils';
import { ActivityNotification } from './ActivityNotification';
import { InvitationNotification } from './InvitationNotification';
import { handleNotification } from '@/lib/notificationUtils';
import { cn } from '@/lib/utils';

interface NotificationItemProps {
  notification: Notification;
  onUserClick: (userId: string, userName: string) => void;
  onJoinClub?: (clubId: string, clubName: string) => void;
  onDeclineInvite?: (id: string) => void;
  formatTime: (timestamp: string) => string;
}

export const NotificationItem: React.FC<NotificationItemProps> = ({
  notification,
  onUserClick,
  onJoinClub,
  onDeclineInvite,
  formatTime,
}) => {
  const { setCurrentView, setSelectedClub } = useApp();

  const handleClubClick = () => {
    // The notification should already be marked as read by opening the popover
    // No need to mark it as read again when clicking on club
    
    const club = findClubFromStorage(notification.clubId);
    
    if (club) {
      setSelectedClub(club);
      setCurrentView('clubDetail');
    } else {
      // Try to use mock club data
      const mockClub = getMockClub(notification.clubId, notification.clubName);
      if (mockClub) {
        setSelectedClub(mockClub);
        setCurrentView('clubDetail');
      } else {
        handleClubError();
      }
    }
  };

  const handleUserItemClick = () => {
    // The notification should already be marked as read by opening the popover
    // No need to mark it as read again when clicking on user
    
    onUserClick(notification.userId, notification.userName);
  };

  const handleJoinClub = () => {
    if (onJoinClub) {
      // When joining club, completely remove the notification from storage
      handleNotification(notification.id, 'delete');
      onJoinClub(notification.clubId, notification.clubName);
    }
  };

  const handleDeclineInvite = () => {
    if (onDeclineInvite) {
      // When declining invitation, completely remove the notification from storage
      handleNotification(notification.id, 'delete');
      onDeclineInvite(notification.id);
    }
  };

  // Determine if the notification is new (unread and not yet displayed)
  const isNewNotification = !notification.read;
  const isUnseenNotification = !notification.previouslyDisplayed;

  const backgroundClass = cn(
    "p-3 border-b hover:bg-gray-50 transition-colors",
    isNewNotification && "bg-blue-50",
    isUnseenNotification && "bg-[#F2FCE2]" // Light green background for new notifications
  );

  return (
    <div className={backgroundClass}>
      <div className="flex items-start gap-3">
        <UserAvatar 
          name={notification.userName} 
          image={notification.userAvatar} 
          size="sm"
          className="cursor-pointer mt-1"
          onClick={handleUserItemClick}
        />
        
        <div className="flex-1 min-w-0">
          {notification.type === 'invitation' ? (
            <InvitationNotification
              userName={notification.userName}
              onUserClick={handleUserItemClick}
              userId={notification.userId}
              clubName={notification.clubName}
              onClubClick={handleClubClick}
              message={notification.message || ''}
              timestamp={notification.timestamp}
              formatTime={formatTime}
              isUnread={isNewNotification}
              onJoinClub={handleJoinClub}
              onDeclineInvite={handleDeclineInvite}
            />
          ) : (
            <ActivityNotification
              userName={notification.userName}
              onUserClick={onUserClick}
              userId={notification.userId}
              distance={notification.distance}
              clubName={notification.clubName}
              onClubClick={handleClubClick}
              timestamp={notification.timestamp}
              formatTime={formatTime}
              isUnread={isNewNotification}
            />
          )}
        </div>
      </div>
    </div>
  );
};
