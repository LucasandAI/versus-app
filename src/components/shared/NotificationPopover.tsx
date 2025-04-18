
import React, { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import Button from './Button';
import UserAvatar from './UserAvatar';
import { toast } from '@/hooks/use-toast';

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
  
  const unreadCount = notifications.filter(n => !n.read).length;
  
  // When the popover opens, mark all notifications as read
  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    // Mark all as read when opening the popover
    if (isOpen && unreadCount > 0) {
      notifications.forEach(n => {
        if (!n.read) onMarkAsRead(n.id);
      });
      
      // Also ensure the notifications are saved to localStorage right away
      const updatedNotifications = notifications.map(n => ({
        ...n,
        read: true
      }));
      localStorage.setItem('notifications', JSON.stringify(updatedNotifications));
    }
  };

  const handleJoinClub = (clubId: string, clubName: string, notificationId: string) => {
    if (onJoinClub) {
      onJoinClub(clubId, clubName);
    } else {
      // Check if user is already in 3 clubs
      const existingClubs = localStorage.getItem('userClubs');
      const clubs = existingClubs ? JSON.parse(existingClubs) : [];
      
      if (clubs.length >= 3) {
        toast({
          title: "Cannot Join Club",
          description: "You are already a member of 3 clubs, which is the maximum allowed.",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Club Joined",
          description: `You have successfully joined ${clubName}!`
        });
      }
    }
    
    // Remove this notification
    if (onDeclineInvite) {
      onDeclineInvite(notificationId);
    }
  };

  const handleDeclineInvite = (notificationId: string) => {
    if (onDeclineInvite) {
      onDeclineInvite(notificationId);
    } else {
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

  // Function to create a test club invitation notification
  const createTestInvitation = () => {
    const newNotification: Notification = {
      id: `invite-${Date.now()}`,
      userId: "admin1",
      userName: "Club Admin",
      userAvatar: "/placeholder.svg",
      clubId: "test-club-1",
      clubName: "Road Runners",
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
      description: "A club invitation notification has been added."
    });
    
    // Reload the page to show the notification
    window.location.reload();
  };

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
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-medium">Notifications</h3>
          <div className="flex gap-2">
            {/* Test button - Only visible in development */}
            {process.env.NODE_ENV !== 'production' && (
              <Button 
                variant="link" 
                size="sm" 
                onClick={createTestInvitation}
                className="text-xs text-green-500 hover:text-green-700 p-0 h-auto"
              >
                Test Invite
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
          {notifications.length > 0 ? (
            notifications.map(notification => (
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
                  
                  <div className="flex-1">
                    <p className="text-sm">
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
                              // Navigate to club details
                              // For now just show a toast
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
                      <div className="flex mt-2 gap-2">
                        <Button
                          variant="default"
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
