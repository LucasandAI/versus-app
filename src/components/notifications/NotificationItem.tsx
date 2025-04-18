
import React from 'react';
import UserAvatar from '@/components/shared/UserAvatar';
import { Notification } from '@/types';
import { useApp } from '@/context/AppContext';
import { findClubFromStorage, getMockClub, handleClubError } from '@/utils/notificationUtils';
import { ActivityNotification } from './ActivityNotification';
import { InvitationNotification } from './InvitationNotification';

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

  const handleJoinClub = () => {
    if (onJoinClub) {
      onJoinClub(notification.clubId, notification.clubName);
    }
  };

  const handleDeclineInvite = () => {
    if (onDeclineInvite) {
      onDeclineInvite(notification.id);
    }
  };

  const isUnread = !notification.read;
  const bgClass = isUnread ? "bg-blue-50" : "";

  return (
    <div className={`p-3 border-b hover:bg-gray-50 transition-colors ${bgClass}`}>
      <div className="flex items-start gap-3">
        <UserAvatar 
          name={notification.userName} 
          image={notification.userAvatar} 
          size="sm"
          className="cursor-pointer mt-1"
          onClick={() => onUserClick(notification.userId, notification.userName)}
        />
        
        <div className="flex-1 min-w-0">
          {notification.type === 'invitation' ? (
            <InvitationNotification
              userName={notification.userName}
              onUserClick={onUserClick}
              userId={notification.userId}
              clubName={notification.clubName}
              onClubClick={handleClubClick}
              message={notification.message || ''}
              timestamp={notification.timestamp}
              formatTime={formatTime}
              isUnread={isUnread}
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
              isUnread={isUnread}
            />
          )}
        </div>
      </div>
    </div>
  );
};
