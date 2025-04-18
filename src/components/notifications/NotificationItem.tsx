
import React from 'react';
import { toast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import Button from '@/components/shared/Button';
import UserAvatar from '@/components/shared/UserAvatar';
import { Notification } from '@/types';

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

  return (
    <div className={`p-3 border-b hover:bg-gray-50 transition-colors ${!notification.read ? 'bg-green-50' : ''}`}>
      <div className="flex items-start gap-3">
        <UserAvatar 
          name={notification.userName} 
          image={notification.userAvatar} 
          size="sm"
          className="cursor-pointer mt-1"
          onClick={() => onUserClick(notification.userId, notification.userName)}
        />
        
        <div className="flex-1 min-w-0">
          <p className="text-sm break-words">
            <span 
              className="font-medium cursor-pointer hover:text-primary"
              onClick={() => onUserClick(notification.userId, notification.userName)}
            >
              {notification.userName}
            </span>
            {' '}
            {notification.type === 'invitation' ? (
              <span>
                {notification.message || 'invited you to join'}{' '}
                <span 
                  className="font-medium cursor-pointer hover:underline text-primary"
                  onClick={() => {
                    toast({
                      title: "Club Details",
                      description: `Viewing ${notification.clubName} details`
                    });
                  }}
                >
                  {notification.clubName}
                </span>
              </span>
            ) : (
              <span>
                added{' '}
                <span className="font-medium">{notification.distance.toFixed(1)}km</span>
                {' '}to{' '}
                <span className="font-medium">{notification.clubName}</span>
              </span>
            )}
          </p>
          <span className="text-xs text-gray-500">{formatTime(notification.timestamp)}</span>
          
          {notification.type === 'invitation' && (
            <div className="flex mt-2 gap-2 flex-wrap">
              <Button
                variant="primary"
                size="sm"
                className="h-8 bg-green-500 hover:bg-green-600"
                onClick={handleJoinClub}
              >
                Join
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-8"
                onClick={handleDeclineInvite}
              >
                Decline
              </Button>
            </div>
          )}

          {!notification.read && (
            <Badge variant="default" className="mt-1 bg-primary text-white text-[10px] h-5">New</Badge>
          )}
        </div>
      </div>
    </div>
  );
};
