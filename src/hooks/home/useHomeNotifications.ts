
import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useApp } from '@/context/AppContext';
import { Notification } from '@/types';
import { handleNotification, markAllNotificationsAsRead } from '@/lib/notificationUtils';

export const useHomeNotifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadMessages, setUnreadMessages] = useState<Record<string, number>>({});
  const { currentUser, setCurrentUser } = useApp();

  // Initialize notifications from localStorage if available
  useEffect(() => {
    const storedNotifications = localStorage.getItem('notifications');
    if (storedNotifications) {
      try {
        const parsedNotifications = JSON.parse(storedNotifications);
        console.log('[useHomeNotifications] Initialized from localStorage:', parsedNotifications.length, parsedNotifications);
        setNotifications(parsedNotifications);
      } catch (error) {
        console.error('[useHomeNotifications] Error parsing stored notifications:', error);
      }
    }
  }, []);

  const handleMarkAsRead = useCallback(async (id: string) => {
    try {
      console.log('[useHomeNotifications] Marking notification as read:', id);
      if (!currentUser?.id) {
        console.log('[useHomeNotifications] No current user, skipping');
        return;
      }

      // Update local state optimistically
      setNotifications(prev => 
        prev.map(notification => 
          notification.id === id ? { ...notification, read: true } : notification
        )
      );
      
      // Update in database and localStorage
      const updatedNotifications = await handleNotification(id, 'read');
      if (!updatedNotifications) {
        // Revert optimistic update on failure
        console.error('[useHomeNotifications] Failed to mark notification as read');
        toast.error("Failed to mark notification as read");
      }
    } catch (error) {
      console.error("[useHomeNotifications] Error marking notification as read:", error);
      toast.error("Failed to mark notification as read");
    }
  }, [notifications, currentUser?.id]);

  const handleJoinClub = useCallback(async (clubId: string, clubName: string) => {
    try {
      console.log('[useHomeNotifications] Handling join club action:', clubId, clubName);
      if (!currentUser?.id) {
        console.log('[useHomeNotifications] No current user, skipping');
        return;
      }
      
      // Find the notification related to this club action
      const notification = notifications.find(
        n => (n.type === 'join_request') && n.clubId === clubId
      );
      
      if (!notification) {
        console.error('[useHomeNotifications] Notification not found for this club action');
        return;
      }
      
      // For join_request type, this means we're accepting someone else's request to join
      if (notification.type === 'join_request' && notification.userId) {
        // Add the requesting user to the club
        const { error: joinError } = await supabase
          .from('club_members')
          .insert({
            user_id: notification.userId, // The user who sent the join request
            club_id: clubId,
            is_admin: false
          });
          
        if (joinError) {
          console.error('[useHomeNotifications] Error adding user to club:', joinError);
          throw joinError;
        }
        
        // Update the join request status to 'accepted' instead of deleting
        const { error: requestError } = await supabase
          .from('club_requests')
          .update({ status: 'accepted' })
          .eq('user_id', notification.userId)
          .eq('club_id', clubId);
          
        if (requestError) {
          console.error('[useHomeNotifications] Error updating request status:', requestError);
          throw requestError;
        }
        
        toast.success(`User has been added to the club`);
      }
      
      // Delete the notification after successfully handling
      await handleNotification(notification.id, 'delete');
      
      // Remove notification from local state
      setNotifications(prev => prev.filter(n => n.id !== notification.id));
      
      // Trigger a refresh of user data
      window.dispatchEvent(new CustomEvent('userDataUpdated'));
      
    } catch (error) {
      console.error("[useHomeNotifications] Error joining club:", error);
      toast.error("Failed to process club action");
    }
  }, [notifications, currentUser]);

  const handleDeclineInvite = useCallback(async (id: string) => {
    try {
      console.log('[useHomeNotifications] Declining notification:', id);
      if (!currentUser?.id) {
        console.log('[useHomeNotifications] No current user, skipping');
        return;
      }
      
      const notification = notifications.find(n => n.id === id);
      if (!notification) {
        console.error('[useHomeNotifications] Invalid notification data');
        throw new Error("Invalid notification data");
      }
      
      // If this is a join request, update the request status to 'rejected' instead of deleting
      if (notification.type === 'join_request' && notification.userId && notification.clubId) {
        const { error } = await supabase
          .from('club_requests')
          .update({ status: 'rejected' })
          .eq('user_id', notification.userId)
          .eq('club_id', notification.clubId);
          
        if (error) {
          console.error('[useHomeNotifications] Error updating request status:', error);
          throw error;
        }
      }
      
      // Delete the notification
      await handleNotification(id, 'delete');
      
      // Update local state
      setNotifications(prev => prev.filter(notification => notification.id !== id));
      
      toast.success(notification.type === 'join_request' ? "Request denied" : "Notification removed");
    } catch (error) {
      console.error("[useHomeNotifications] Error declining notification:", error);
      toast.error("Failed to process notification");
    }
  }, [notifications, currentUser?.id]);

  const handleClearAllNotifications = useCallback(async () => {
    try {
      console.log('[useHomeNotifications] Clearing all notifications');
      if (!currentUser?.id) {
        console.log('[useHomeNotifications] No current user, skipping');
        return;
      }
      
      // Mark all notifications as read in database and localStorage
      const updatedNotifications = await markAllNotificationsAsRead();
      
      // Update local state
      if (updatedNotifications) {
        setNotifications(updatedNotifications);
        toast.success("All notifications cleared");
      }
    } catch (error) {
      console.error("[useHomeNotifications] Error clearing notifications:", error);
      toast.error("Failed to clear notifications");
    }
  }, [currentUser?.id]);

  // Define the updateUnreadCount function with the proper signature
  const updateUnreadCount = useCallback((count: number) => {
    console.log('[useHomeNotifications] Updating unread count:', count);
    // We need to convert our count number to update the unreadMessages object
    const unreadMessagesCounts = localStorage.getItem('unreadMessages');
    try {
      const parsed = unreadMessagesCounts ? JSON.parse(unreadMessagesCounts) : {};
      const totalCount = Object.values(parsed).reduce((sum: number, val: any) => 
        sum + (typeof val === 'number' ? val : 0), 0);
      
      // Use this count for your UI instead of updating the record directly
      // We'll track this as a separate value in the state
      if (totalCount !== count) {
        // Just dispatch an event to notify handlers that unread messages updated
        window.dispatchEvent(new CustomEvent('unreadMessagesUpdated'));
      }
    } catch (e) {
      console.error("[useHomeNotifications] Error parsing unread messages:", e);
    }
  }, []);

  return {
    notifications,
    setNotifications,
    unreadMessages,
    setUnreadMessages,
    updateUnreadCount,
    handleMarkAsRead,
    handleJoinClub,
    handleDeclineInvite,
    handleClearAllNotifications
  };
};
