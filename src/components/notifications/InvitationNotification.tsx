
import React from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface InvitationNotificationProps {
  userName: string;
  onUserClick: (userId: string, userName: string) => void;
  userId: string;
  clubName: string;
  onClubClick: () => void;
  message: string;
  timestamp: string;
  formatTime: (timestamp: string) => string;
  isUnread: boolean;
  onJoinClub: () => void;
  onDeclineInvite: () => void;
}

export const InvitationNotification: React.FC<InvitationNotificationProps> = ({
  userName,
  onUserClick,
  userId,
  clubName,
  onClubClick,
  message,
  timestamp,
  formatTime,
  isUnread,
  onJoinClub,
  onDeclineInvite,
}) => {
  return (
    <div>
      <p className={cn("text-sm break-words", isUnread && "font-medium")}>
        <span 
          className="cursor-pointer hover:text-primary"
          onClick={() => onUserClick(userId, userName)}
        >
          {userName}
        </span>
        {' '}
        <span>
          {message || 'invited you to join'}{' '}
          <span 
            className="font-medium cursor-pointer hover:underline text-primary"
            onClick={onClubClick}
          >
            {clubName}
          </span>
        </span>
        <br />
        <span className="text-xs text-gray-500">{formatTime(timestamp)}</span>
      </p>
      <div className="flex mt-2 gap-2 flex-wrap">
        <Button
          variant="default"
          size="sm"
          className="h-8 bg-green-500 hover:bg-green-600"
          onClick={onJoinClub}
        >
          Join
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="h-8"
          onClick={onDeclineInvite}
        >
          Decline
        </Button>
      </div>
    </div>
  );
};
