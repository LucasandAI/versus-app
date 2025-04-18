
import React from 'react';
import { toast } from '@/hooks/use-toast';
import Button from '@/components/shared/Button';
import UserAvatar from '@/components/shared/UserAvatar';
import { Notification } from '@/types';
import { useApp } from '@/context/AppContext';

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

  const handleClubClick = () => {
    // Get all clubs from localStorage
    try {
      const allClubs = JSON.parse(localStorage.getItem('clubs') || '[]');
      // Try to find the club
      const club = allClubs.find((c: any) => c.id === notification.clubId);
      
      if (club) {
        // Set the selected club and navigate to club detail view
        setSelectedClub(club);
        setCurrentView('clubDetail');
      } else {
        // If club not in localStorage yet, use available clubs data
        const mockClubs = [
          {
            id: 'ac1',
            name: 'Morning Joggers',
            division: 'Silver',
            tier: 3,
            logo: '/placeholder.svg',
            members: []
          },
          {
            id: 'ac2',
            name: 'Hill Climbers',
            division: 'Gold',
            tier: 2,
            logo: '/placeholder.svg',
            members: []
          },
          {
            id: 'ac3',
            name: 'Urban Pacers',
            division: 'Bronze',
            tier: 5,
            logo: '/placeholder.svg',
            members: []
          }
        ];
        
        const mockClub = mockClubs.find(c => c.id === notification.clubId);
        if (mockClub) {
          setSelectedClub(mockClub);
          setCurrentView('clubDetail');
        } else {
          toast({
            title: "Club Not Found",
            description: `Details for ${notification.clubName} are not available yet.`
          });
        }
      }
    } catch (error) {
      console.error('Error accessing club data:', error);
      toast({
        title: "Error",
        description: "Could not load club details",
        variant: "destructive"
      });
    }
  };

  // Always show blue highlight for notifications in the popover
  // This makes it visually clear which notifications are new/recent
  return (
    <div className="p-3 border-b hover:bg-gray-50 transition-colors bg-blue-50">
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
                  onClick={handleClubClick}
                >
                  {notification.clubName}
                </span>
              </span>
            ) : (
              <span>
                added{' '}
                <span className="font-medium">{notification.distance.toFixed(1)}km</span>
                {' '}to{' '}
                <span 
                  className="font-medium cursor-pointer hover:underline text-primary"
                  onClick={handleClubClick}
                >
                  {notification.clubName}
                </span>
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
        </div>
      </div>
    </div>
  );
};
