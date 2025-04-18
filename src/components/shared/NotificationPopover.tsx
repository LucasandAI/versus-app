
import React, { useState, useEffect } from 'react';
import { Bell, Plus } from 'lucide-react';
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import Button from './Button';
import UserAvatar from './UserAvatar';
import { toast } from '@/hooks/use-toast';
import { useApp } from '@/context/AppContext';

interface Notification {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  clubId: string;
  clubName: string;
  distance: number;
  timestamp: string;
  read: boolean;
  type?: 'activity' | 'invitation';
  message?: string;
}

interface NotificationPopoverProps {
  notifications: Notification[];
  onMarkAsRead: (id: string) => void;
  onClearAll: () => void;
  onUserClick: (userId: string, userName: string) => void;
  onJoinClub?: (clubId: string, clubName: string) => void;
  onDeclineInvite?: (notificationId: string) => void;
}

const NotificationPopover: React.FC<NotificationPopoverProps> = ({
  notifications,
  onMarkAsRead,
  onClearAll,
  onUserClick,
  onJoinClub,
  onDeclineInvite
}) => {
  const [open, setOpen] = useState(false);
  const { setCurrentUser, currentUser } = useApp();
  
  const unreadCount = notifications.filter(n => !n.read).length;
  
  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen && unreadCount > 0) {
      notifications.forEach(n => {
        if (!n.read) onMarkAsRead(n.id);
      });
      
      const updatedNotifications = notifications.map(n => ({
        ...n,
        read: true
      }));
      localStorage.setItem('notifications', JSON.stringify(updatedNotifications));
    }
  };

  const handleJoinClub = (clubId: string, clubName: string, notificationId: string) => {
    // Check if user is already a member of this specific club
    if (!currentUser) {
      toast({
        title: "Error",
        description: "You need to be logged in to join a club.",
        variant: "destructive"
      });
      return;
    }
    
    const isAlreadyMember = currentUser.clubs.some(club => club.id === clubId);
    
    if (isAlreadyMember) {
      toast({
        title: "Already a Member",
        description: `You are already a member of ${clubName}.`,
        variant: "destructive"
      });
      // Remove the notification even if already a member
      if (onDeclineInvite) {
        onDeclineInvite(notificationId);
      }
    } else if (currentUser.clubs.length >= 3) {
      toast({
        title: "Cannot Join Club",
        description: "You are already a member of 3 clubs, which is the maximum allowed.",
        variant: "destructive"
      });
      // Remove the notification if can't join
      if (onDeclineInvite) {
        onDeclineInvite(notificationId);
      }
    } else {
      if (onJoinClub) {
        onJoinClub(clubId, clubName);
        
        // Get club data from local storage to add to user's clubs
        const allClubs = localStorage.getItem('clubs');
        if (allClubs) {
          const clubs = JSON.parse(allClubs);
          const clubToJoin = clubs.find((club: any) => club.id === clubId);
          
          if (clubToJoin) {
            // Add user as a member to the club
            const updatedMember = {
              id: currentUser.id,
              name: currentUser.name,
              avatar: currentUser.avatar,
              isAdmin: false
            };
            
            clubToJoin.members.push(updatedMember);
            
            // Update the clubs in localStorage
            localStorage.setItem('clubs', JSON.stringify(clubs));
            
            // Update user's clubs in state
            const updatedUser = {
              ...currentUser,
              clubs: [...currentUser.clubs, clubToJoin]
            };
            
            setCurrentUser(updatedUser);
            
            // Update user data in localStorage
            localStorage.setItem('currentUser', JSON.stringify(updatedUser));
            
            toast({
              title: "Club Joined",
              description: `You have successfully joined ${clubName}!`
            });
          }
        }
      }
      
      // Always remove the notification after handling
      if (onDeclineInvite) {
        onDeclineInvite(notificationId);
      }
    }
  };

  const handleDeclineInvite = (notificationId: string) => {
    if (onDeclineInvite) {
      onDeclineInvite(notificationId);
      
      // Remove from localStorage
      const storedNotifications = localStorage.getItem('notifications');
      if (storedNotifications) {
        const parsedNotifications = JSON.parse(storedNotifications);
        const filteredNotifications = parsedNotifications.filter(
          (notification: Notification) => notification.id !== notificationId
        );
        localStorage.setItem('notifications', JSON.stringify(filteredNotifications));
      }
      
      toast({
        title: "Invitation Declined",
        description: "You have declined the club invitation."
      });
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    
    return date.toLocaleDateString();
  };

  const createTestInvitation = () => {
    // Create a test invitation for a club the user is not already a member of
    const clubIds = ['test-club-1', 'test-club-2', 'cressay-running-club'];
    const clubNames = ['Road Runners', 'Sprint Masters', 'Cressay Running Club'];
    
    // Find a club the user is not already a member of
    let clubIndex = 2; // Default to "Cressay Running Club"
    
    if (currentUser && currentUser.clubs.length > 0) {
      const userClubIds = currentUser.clubs.map(club => club.id);
      
      // Always use Cressay Running Club as it's the one we want to test
      if (userClubIds.includes('cressay-running-club')) {
        // If user has Cressay, use another club
        clubIndex = userClubIds.includes('test-club-1') ? 1 : 0;
      }
    }
    
    const newNotification: Notification = {
      id: `invite-${Date.now()}`,
      userId: "admin1",
      userName: "Club Admin",
      userAvatar: "/placeholder.svg",
      clubId: clubIds[clubIndex],
      clubName: clubNames[clubIndex],
      distance: 0,
      timestamp: new Date().toISOString(),
      read: false,
      type: 'invitation',
      message: 'invited you to join their club'
    };
    
    const existingNotifications = localStorage.getItem('notifications');
    const notifications = existingNotifications ? JSON.parse(existingNotifications) : [];
    notifications.push(newNotification);
    localStorage.setItem('notifications', JSON.stringify(notifications));
    
    toast({
      title: "Test Notification Created",
      description: `A club invitation notification has been added for ${clubNames[clubIndex]}.`
    });
    
    // Trigger a reload to see the new notification
    window.location.reload();
  };

  // Sort notifications from most recent to oldest
  const sortedNotifications = [...notifications].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <button className="relative text-primary hover:bg-gray-100 rounded-full p-2">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 h-4 w-4 text-[10px] flex items-center justify-center bg-red-500 text-white rounded-full">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0 max-w-[90vw]" align="end">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-medium">Notifications</h3>
          <div className="flex gap-2">
            {process.env.NODE_ENV !== 'production' && (
              <Button 
                variant="primary" 
                size="sm" 
                onClick={createTestInvitation}
                className="p-1 h-6 w-6 flex justify-center items-center text-green-500 hover:text-green-700"
              >
                <Plus className="h-4 w-4" />
                <span className="sr-only">Add test invite</span>
              </Button>
            )}
            {notifications.length > 0 && (
              <Button 
                variant="link" 
                size="sm" 
                onClick={onClearAll}
                className="text-xs text-gray-500 hover:text-gray-900 p-0 h-auto"
              >
                Clear all
              </Button>
            )}
          </div>
        </div>
        
        <div className="max-h-[300px] overflow-y-auto">
          {sortedNotifications.length > 0 ? (
            sortedNotifications.map(notification => (
              <div 
                key={notification.id} 
                className={`p-3 border-b hover:bg-gray-50 transition-colors ${!notification.read ? 'bg-blue-50' : ''}`}
              >
                <div className="flex items-start gap-3">
                  <UserAvatar 
                    name={notification.userName} 
                    image={notification.userAvatar} 
                    size="sm"
                    className="cursor-pointer mt-1"
                    onClick={() => {
                      onUserClick(notification.userId, notification.userName);
                      setOpen(false);
                    }}
                  />
                  
                  <div className="flex-1 min-w-0">
                    <p className="text-sm break-words">
                      <span 
                        className="font-medium cursor-pointer hover:text-primary"
                        onClick={() => {
                          onUserClick(notification.userId, notification.userName);
                          setOpen(false);
                        }}
                      >
                        {notification.userName}
                      </span>
                      {' '}
                      {notification.type === 'invitation' ? 
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
                        : 
                        <span>
                          added{' '}
                          <span className="font-medium">{notification.distance.toFixed(1)}km</span>
                          {' '}to{' '}
                          <span className="font-medium">{notification.clubName}</span>
                        </span>
                      }
                    </p>
                    <span className="text-xs text-gray-500">{formatTime(notification.timestamp)}</span>
                    
                    {notification.type === 'invitation' && (
                      <div className="flex mt-2 gap-2 flex-wrap">
                        <Button
                          variant="primary"
                          size="sm"
                          className="h-8 bg-green-500 hover:bg-green-600"
                          onClick={() => handleJoinClub(notification.clubId, notification.clubName, notification.id)}
                        >
                          Join
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8"
                          onClick={() => handleDeclineInvite(notification.id)}
                        >
                          Decline
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="p-4 text-center text-gray-500">
              No notifications
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default NotificationPopover;
