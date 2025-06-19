
import React, { useState } from 'react';
import { Notification } from '@/types';
import { Button } from '@/components/ui/button';
import { Check, X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useApp } from '@/context/AppContext';
import { acceptClubInvite, denyClubInvite } from '@/utils/clubInviteActions';
import { acceptJoinRequest, denyJoinRequest } from '@/utils/joinRequestUtils';

interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead: (id: string) => void;
  onUserClick: (userId: string, userName: string) => void;
  onDeclineInvite?: (notificationId: string) => void;
  onOptimisticDelete?: (notificationId: string) => void;
  formatTime: (timestamp: string) => string;
}

const NotificationItem: React.FC<NotificationItemProps> = ({
  notification,
  onMarkAsRead,
  onUserClick,
  onDeclineInvite,
  onOptimisticDelete,
  formatTime
}) => {
  const { setCurrentView, setSelectedClub, currentUser } = useApp();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleUserClick = (userId: string, userName: string) => {
    console.log(`[NotificationItem] Opening profile for user: ${userName} (${userId})`);
    onUserClick(userId, userName);
  };

  const handleMarkAsRead = async (id: string) => {
    console.log(`[NotificationItem] Marking notification as read: ${id}`);
    onMarkAsRead(id);
  };

  const getActionButtons = () => {
    if (isProcessing) {
      return (
        <Button variant="secondary" size="sm" disabled>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Loading
        </Button>
      );
    }

    switch (notification.type) {
      case 'invite':
        return (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleDeclineInvite}>
              <X className="mr-2 h-4 w-4" />
              Decline
            </Button>
            <Button size="sm" onClick={handleAcceptInvite}>
              <Check className="mr-2 h-4 w-4" />
              Accept
            </Button>
          </div>
        );
      case 'join_request':
        return (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleDenyJoinRequest}>
              <X className="mr-2 h-4 w-4" />
              Decline
            </Button>
            <Button size="sm" onClick={handleAcceptJoinRequest}>
              <Check className="mr-2 h-4 w-4" />
              Accept
            </Button>
          </div>
        );
      default:
        return null;
    }
  };

  const handleAcceptInvite = async () => {
    if (!notification.clubId || isProcessing) return;
    
    setIsProcessing(true);
    
    try {
      const success = await acceptClubInvite(
        notification.id,
        notification.clubId,
        currentUser?.id || ''
      );
      
      if (success && onOptimisticDelete) {
        onOptimisticDelete(notification.id);
      }
    } catch (error) {
      console.error('Error accepting invite:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeclineInvite = async () => {
    if (!notification.clubId || isProcessing) return;
    
    setIsProcessing(true);
    
    try {
      const success = await denyClubInvite(
        notification.id,
        notification.clubId,
        currentUser?.id || ''
      );
      
      if (success && onOptimisticDelete) {
        onOptimisticDelete(notification.id);
      }
    } catch (error) {
      console.error('Error declining invite:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAcceptJoinRequest = async () => {
    if (!notification.data?.userId || !notification.clubId || isProcessing) return;
    
    setIsProcessing(true);
    
    try {
      const success = await acceptJoinRequest(
        notification.data.userId,
        notification.clubId,
        notification.data.userName || 'Unknown User'
      );
      
      if (success && onOptimisticDelete) {
        onOptimisticDelete(notification.id);
      }
    } catch (error) {
      console.error('Error accepting join request:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDenyJoinRequest = async () => {
    if (!notification.data?.userId || !notification.clubId || isProcessing) return;
    
    setIsProcessing(true);
    
    try {
      const success = await denyJoinRequest(
        notification.data.userId,
        notification.clubId
      );
      
      if (success && onOptimisticDelete) {
        onOptimisticDelete(notification.id);
      }
    } catch (error) {
      console.error('Error denying join request:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle club navigation for request_accepted notifications
  const handleClubClick = () => {
    if (notification.type === 'request_accepted' && notification.data?.clubId) {
      // Navigate to the club that the user was accepted to
      const clubData = {
        id: notification.data.clubId,
        name: notification.data.clubName || 'Unknown Club',
        logo: notification.data.clubLogo || '/placeholder.svg',
        division: 'bronze' as const,
        tier: 5,
        elitePoints: 0,
        members: []
      };
      
      setSelectedClub(clubData);
      setCurrentView('clubDetail');
      
      // Mark as read
      if (!notification.read) {
        onMarkAsRead(notification.id);
      }
    }
  };

  // Render message with clickable club names and usernames
  const renderMessage = () => {
    let message = notification.message;
    
    // Handle club name clicks for request_accepted notifications
    if (notification.type === 'request_accepted' && notification.data?.clubName) {
      const clubName = notification.data.clubName;
      message = message.replace(
        clubName,
        `<span class="text-blue-600 hover:text-blue-800 cursor-pointer font-medium">${clubName}</span>`
      );
    }
    
    // Handle username clicks for join_request notifications
    if (notification.type === 'join_request' && notification.data?.userName && notification.data?.userId) {
      const userName = notification.data.userName;
      message = message.replace(
        userName,
        `<span class="text-blue-600 hover:text-blue-800 cursor-pointer font-medium">${userName}</span>`
      );
    }
    
    return (
      <div 
        className="text-sm"
        dangerouslySetInnerHTML={{ __html: message }}
        onClick={(e) => {
          const target = e.target as HTMLElement;
          if (target.tagName === 'SPAN' && target.classList.contains('cursor-pointer')) {
            if (notification.type === 'request_accepted') {
              handleClubClick();
            } else if (notification.type === 'join_request' && notification.data?.userId) {
              handleUserClick(notification.data.userId, notification.data.userName || 'User');
            }
          }
        }}
      />
    );
  };

  return (
    <div className="p-3 border-b border-gray-100 last:border-b-0 hover:bg-gray-50">
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          {/* Message content with clickable elements */}
          {renderMessage()}
          
          {/* Timestamp */}
          <div className="text-xs text-gray-500 mt-1">
            {formatTime(notification.timestamp)}
          </div>
          
          {/* Action buttons */}
          <div className="mt-2">
            {getActionButtons()}
          </div>
        </div>
        
        {/* Unread indicator */}
        {!notification.read && (
          <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-2" />
        )}
      </div>
    </div>
  );
};

export default NotificationItem;
