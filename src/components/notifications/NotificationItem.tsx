
import React from 'react';
import { toast } from '@/hooks/use-toast';
import Button from '@/components/shared/Button';
import UserAvatar from '@/components/shared/UserAvatar';
import { Notification, Club, Division } from '@/types';
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
  const { setCurrentView, setSelectedClub, currentUser } = useApp();

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
            division: 'Silver' as Division,
            tier: 3,
            logo: '/placeholder.svg',
            members: [],
            matchHistory: [] // Add required property from Club type
          },
          {
            id: 'ac2',
            name: 'Hill Climbers',
            division: 'Gold' as Division,
            tier: 2,
            logo: '/placeholder.svg',
            members: [],
            matchHistory: [] // Add required property from Club type
          },
          {
            id: 'ac3',
            name: 'Trail Blazers',
            division: 'Bronze' as Division,
            tier: 5,
            logo: '/placeholder.svg',
            members: [],
            matchHistory: [] // Add required property from Club type
          },
          {
            id: 'ac4',
            name: 'Mountain Goats',
            division: 'Silver' as Division,
            tier: 4,
            logo: '/placeholder.svg',
            members: [],
            matchHistory: [] // Add required property from Club type
          },
          {
            id: 'ac5',
            name: 'Speed Demons',
            division: 'Gold' as Division,
            tier: 1,
            logo: '/placeholder.svg',
            members: [],
            matchHistory: [] // Add required property from Club type
          }
        ];
        
        const mockClub = mockClubs.find(c => c.id === notification.clubId);
        if (mockClub) {
          // Create a complete Club object that matches the required type
          const completeClub: Club = {
            id: mockClub.id,
            name: mockClub.name,
            division: mockClub.division,
            tier: mockClub.tier,
            logo: mockClub.logo,
            members: [], // Important: Don't add current user here, they haven't joined yet
            matchHistory: [] // Ensure required property is included
          };
          setSelectedClub(completeClub);
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

  // Always show blue highlight for unread notifications
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
