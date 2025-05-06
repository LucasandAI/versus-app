
import React from 'react';
import { Button } from '@/components/ui/button';

interface InvitationNotificationProps {
  userName: string;
  userId: string;
  onUserClick: (userId: string, userName: string) => void;
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
  userId,
  onUserClick,
  clubName,
  onClubClick,
  message,
  timestamp,
  formatTime,
  isUnread,
  onJoinClub,
  onDeclineInvite
}) => {
  const handleUserClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onUserClick(userId, userName);
  };

  const handleClubClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClubClick();
  };

  const handleJoin = (e: React.MouseEvent) => {
    e.stopPropagation();
    onJoinClub();
  };

  const handleDecline = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDeclineInvite();
  };

  return (
    <div>
      <p className="text-sm">
        <span 
          className="font-medium cursor-pointer hover:underline"
          onClick={handleUserClick}
        >
          {userName}
        </span>
        {' '}
        {message}
        {' '}
        <span 
          className="font-medium cursor-pointer hover:underline"
          onClick={handleClubClick}
        >
          {clubName}
        </span>
      </p>
      <div className="flex mt-2 gap-2 flex-wrap">
        <Button
          variant="default"
          size="sm"
          className="h-8 bg-green-500 hover:bg-green-600"
          onClick={handleJoin}
        >
          Join
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="h-8"
          onClick={handleDecline}
        >
          Decline
        </Button>
      </div>
      <p className="text-xs text-gray-500 mt-1">{formatTime(timestamp)}</p>
    </div>
  );
};
