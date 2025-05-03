
import React from 'react';
import { Notification } from '@/types';
import { cn } from '@/lib/utils';
import { useNavigation } from '@/hooks/useNavigation';
import { Button } from '@/components/ui/button';
import { acceptClubInvite, denyClubInvite } from '@/utils/clubInviteActions';
import { acceptJoinRequestFromNotification, denyJoinRequestFromNotification } from '@/utils/joinRequestActions';
import { toast } from 'sonner';
import { useApp } from '@/context/AppContext';

interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead?: (id: string) => void;
  onUserClick: (userId: string, userName: string) => void;
  onDeclineInvite?: (id: string) => void;
  formatTime: (timestamp: string) => string;
  onOptimisticDelete?: (id: string) => void; // New prop for optimistic UI updates
}

export const NotificationItem: React.FC<NotificationItemProps> = ({
  notification,
  onMarkAsRead,
  onUserClick,
  onDeclineInvite,
  formatTime,
  onOptimisticDelete,
}) => {
  const { navigateToClub, navigateToUserProfile } = useNavigation();
  const { currentUser } = useApp();

  // Handle club name clicks
  const handleClubClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const clubId = notification.clubId || notification.data?.clubId;
    const clubName = notification.data?.clubName || notification.clubName || 'Unknown Club';
    
    if (clubId && clubName) {
      console.log("[NotificationItem] Navigating to club:", clubId, clubName);
      navigateToClub(clubId, { id: clubId, name: clubName }); // Added clubId as first parameter
      
      // Mark as read when clicked
      if (onMarkAsRead && !notification.read) {
        onMarkAsRead(notification.id);
      }
    } else {
      console.warn("[NotificationItem] Cannot navigate to club, missing data:", clubId, clubName);
    }
  };

  // Handle user name clicks
  const handleUserClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    let userId = notification.userId;
    let userName = notification.userName || 'Unknown User';
    
    // For join requests, the user ID might be in the data field under various properties
    if (notification.type === 'join_request' && notification.data) {
      // Try all possible locations for user ID in the notification data
      userId = notification.data.userId || notification.data.requesterId || userId;
      userName = notification.data.userName || notification.data.requesterName || userName;
    }
    
    console.log("[NotificationItem] User click data:", { userId, userName, notificationData: notification.data });
    
    if (userId && userName) {
      console.log("[NotificationItem] Navigating to user:", userId, userName);
      navigateToUserProfile(userId, userName);
      
      // Mark as read when clicked
      if (onMarkAsRead && !notification.read) {
        onMarkAsRead(notification.id);
      }
    } else {
      console.warn("[NotificationItem] Cannot navigate to user, missing data:", userId, userName);
    }
  };

  const handleAcceptInvite = async (e: React.MouseEvent) => {
    e.stopPropagation();

    if (!currentUser) {
      toast.error('You must be logged in to accept invitations');
      return;
    }

    if (notification.type === 'invite') {
      const clubId = notification.clubId || notification.data?.clubId;
      
      if (!clubId) {
        console.error('[NotificationItem] Missing clubId for invite action');
        return;
      }
      
      // Apply optimistic UI update before the actual operation
      if (onOptimisticDelete) {
        onOptimisticDelete(notification.id);
      }
      
      try {
        const success = await acceptClubInvite(notification.id, clubId, currentUser.id);
        
        if (!success && onOptimisticDelete) {
          toast.error('Failed to accept invitation. Please try again.');
          // The notification will be restored through the notificationsUpdated event
          window.dispatchEvent(new CustomEvent('notificationsUpdated'));
        }
      } catch (error) {
        console.error('[NotificationItem] Error accepting club invite:', error);
        toast.error('Error processing invitation');
        
        // Restore the UI state on error
        if (onOptimisticDelete) {
          window.dispatchEvent(new CustomEvent('notificationsUpdated'));
        }
      }
    }
  };

  const handleJoinClub = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (notification.type === 'join_request') {
      // Get the requester ID correctly from notification data
      const requesterId = notification.data?.userId;
      const clubId = notification.clubId || notification.data?.clubId;
      
      console.log("[NotificationItem] Accepting join request:", {
        requesterId,
        clubId, 
        notificationId: notification.id,
        notificationData: notification.data
      });
      
      if (!requesterId || !clubId) {
        console.error("[NotificationItem] Missing requesterId or clubId for accept action");
        return;
      }
      
      // Apply optimistic UI update before the actual operation
      if (onOptimisticDelete) {
        onOptimisticDelete(notification.id);
      }
      
      try {
        // Use utility function for the actual database operation
        const success = await acceptJoinRequestFromNotification(requesterId, clubId);
        console.log("[NotificationItem] Accept result:", success);
        
        if (!success && onOptimisticDelete) {
          // If operation failed, show error and restore the notification in UI
          toast.error("Failed to accept join request. Please try again.");
          // The notification will be restored through the notificationsUpdated event
          window.dispatchEvent(new CustomEvent('notificationsUpdated'));
        }
      } catch (error) {
        console.error("[NotificationItem] Error accepting join request:", error);
        toast.error("Error processing request");
        
        // Restore the UI state on error
        if (onOptimisticDelete) {
          window.dispatchEvent(new CustomEvent('notificationsUpdated'));
        }
      }
    }
  };

  const handleDeclineInvite = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (notification.type === 'join_request') {
      // Get the requester ID correctly from notification data
      const requesterId = notification.data?.userId;
      const clubId = notification.clubId || notification.data?.clubId;
      
      console.log("[NotificationItem] Declining join request:", {
        requesterId,
        clubId,
        notificationId: notification.id,
        notificationData: notification.data
      });
      
      if (!requesterId || !clubId) {
        console.error("[NotificationItem] Missing requesterId or clubId for decline action");
        return;
      }
      
      // Apply optimistic UI update before the actual operation
      if (onOptimisticDelete) {
        onOptimisticDelete(notification.id);
      }
      
      try {
        // Use utility function for the actual database operation
        const success = await denyJoinRequestFromNotification(requesterId, clubId);
        console.log("[NotificationItem] Decline result:", success);
        
        if (!success && onOptimisticDelete) {
          // If operation failed, show error and restore the notification in UI
          toast.error("Failed to deny join request. Please try again.");
          // The notification will be restored through the notificationsUpdated event
          window.dispatchEvent(new CustomEvent('notificationsUpdated'));
        }
      } catch (error) {
        console.error("[NotificationItem] Error declining join request:", error);
        toast.error("Error processing request");
        
        // Restore the UI state on error
        if (onOptimisticDelete) {
          window.dispatchEvent(new CustomEvent('notificationsUpdated'));
        }
      }
    } else if (notification.type === 'invite') {
      // Handle club invite decline
      if (!currentUser) {
        toast.error('You must be logged in to decline invitations');
        return;
      }
      
      const clubId = notification.clubId || notification.data?.clubId;
      
      if (!clubId) {
        console.error('[NotificationItem] Missing clubId for invite action');
        return;
      }
      
      // Apply optimistic UI update
      if (onOptimisticDelete) {
        onOptimisticDelete(notification.id);
      }
      
      try {
        const success = await denyClubInvite(notification.id, clubId, currentUser.id);
        
        if (!success && onOptimisticDelete) {
          // Restore UI on error
          window.dispatchEvent(new CustomEvent('notificationsUpdated'));
        }
      } catch (error) {
        console.error('[NotificationItem] Error declining club invite:', error);
        
        // Restore UI on error
        if (onOptimisticDelete) {
          window.dispatchEvent(new CustomEvent('notificationsUpdated'));
        }
      }
    } else if (onDeclineInvite) {
      // Handle other types of notifications
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

  // Create a formatted message with clickable parts based on notification type
  const formatMessage = () => {
    // For join requests - what admins see when users request to join their club
    if (notification.type === 'join_request') {
      // Try to get user and club names from different possible locations in the data
      const userName = notification.data?.requesterName || notification.data?.userName;
      const clubName = notification.data?.clubName;
      
      console.log("[NotificationItem] Formatting join request:", { 
        userName, 
        clubName, 
        data: notification.data 
      });
      
      if (userName && clubName) {
        return (
          <p className="text-sm">
            <span 
              className="font-medium text-primary cursor-pointer hover:underline"
              onClick={handleUserClick}
            >
              {userName}
            </span>
            {' has requested to join '}
            <span 
              className="font-medium text-primary cursor-pointer hover:underline"
              onClick={handleClubClick}
            >
              {clubName}
            </span>
          </p>
        );
      }
    }
    
    // For club invites
    if (notification.type === 'invite' && (notification.data?.clubName || notification.clubName)) {
      const clubName = notification.data?.clubName || notification.clubName;
      return (
        <p className="text-sm">
          {'You\'ve been invited to join '}
          <span 
            className="font-medium text-primary cursor-pointer hover:underline"
            onClick={handleClubClick}
          >
            {clubName}
          </span>
        </p>
      );
    }
    
    // For accepted join requests notifications
    if (notification.type === 'request_accepted' && (notification.data?.clubName || notification.clubName)) {
      const clubName = notification.data?.clubName || notification.clubName;
      return (
        <p className="text-sm">
          {'You\'ve been added to '}
          <span 
            className="font-medium text-primary cursor-pointer hover:underline"
            onClick={handleClubClick}
          >
            {clubName}
          </span>
        </p>
      );
    }
    
    // Default message without formatting
    return <p className="text-sm">{notification.message}</p>;
  };

  // Determine which action buttons to show based on notification type
  const showJoinRequestButtons = notification.type === 'join_request';
  const showInviteButtons = notification.type === 'invite';

  return (
    <div 
      className={backgroundClass} 
      onClick={() => {
        if (onMarkAsRead && !notification.read) {
          onMarkAsRead(notification.id);
        }
      }}
    >
      <div className="flex flex-col gap-2">
        <div className="flex items-start justify-between">
          {formatMessage()}
          <span className="text-xs text-gray-500 ml-2 whitespace-nowrap">
            {formatTime(notification.timestamp)}
          </span>
        </div>
        
        {/* Show buttons for join requests */}
        {showJoinRequestButtons && (
          <div className="flex gap-2 mt-1">
            <Button 
              onClick={handleJoinClub}
              size="sm"
              className="px-3 py-1 bg-primary text-white text-xs rounded h-7"
            >
              Accept
            </Button>
            <Button 
              onClick={handleDeclineInvite}
              size="sm"
              variant="outline"
              className="px-3 py-1 text-xs rounded h-7"
            >
              Deny
            </Button>
          </div>
        )}

        {/* Show buttons for invites */}
        {showInviteButtons && (
          <div className="flex gap-2 mt-1">
            <Button 
              onClick={handleAcceptInvite}
              size="sm"
              className="px-3 py-1 bg-primary text-white text-xs rounded h-7"
            >
              Accept
            </Button>
            <Button 
              onClick={handleDeclineInvite}
              size="sm"
              variant="outline"
              className="px-3 py-1 text-xs rounded h-7"
            >
              Decline
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
