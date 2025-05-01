
import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useApp } from '@/context/AppContext';
import { Notification } from '@/types';
import { handleNotification, markAllNotificationsAsRead } from '@/lib/notificationUtils';

export const useHomeNotifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadMessages, setUnreadMessages] = useState<Record<string, number>>({});
  const { currentUser, setCurrentUser, refreshCurrentUser } = useApp();

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

  const handleJoinClub = useCallback(async (clubId: string, clubName: string, requesterId: string) => {
    try {
      console.log('[useHomeNotifications] Handling join club action:', clubId, clubName, requesterId);
      if (!currentUser?.id) {
        console.log('[useHomeNotifications] No current user, skipping');
        return;
      }

      // Find the notification related to this club action
      const notification = notifications.find(
        n => (n.type === 'join_request') && 
            ((n.clubId === clubId || n.data?.clubId === clubId) &&
             (n.data?.requesterId === requesterId || n.userId === requesterId))
      );
      
      console.log('[useHomeNotifications] Found notification for join request:', notification);
      
      if (!notification) {
        console.error('[useHomeNotifications] Notification not found for this club action');
        return;
      }
      
      // First check if the club already has 5 members (maximum)
      const { data: clubMembers, error: membersError } = await supabase
        .from('clubs')
        .select('member_count')
        .eq('id', clubId)
        .single();
        
      if (membersError) {
        console.error('[useHomeNotifications] Error checking club members:', membersError);
        throw membersError;
      }
      
      if (clubMembers && clubMembers.member_count >= 5) {
        toast.error("Club is full (5/5 members). Cannot add more members.");
        return;
      }
      
      console.log('[useHomeNotifications] Adding requester to club:', requesterId, clubId);
      
      // Add the requesting user to the club members
      const { error: joinError } = await supabase
        .from('club_members')
        .insert({
          user_id: requesterId,
          club_id: clubId,
          is_admin: false
        });
        
      if (joinError) {
        console.error('[useHomeNotifications] Error adding user to club:', joinError);
        throw joinError;
      }
      
      // Update request status to accepted instead of deleting
      const { error: requestError } = await supabase
        .from('club_requests')
        .update({ status: 'accepted' })
        .eq('user_id', requesterId)
        .eq('club_id', clubId);
        
      if (requestError) {
        console.error('[useHomeNotifications] Error updating request status:', requestError);
        throw requestError;
      }
      
      // Delete all notifications related to this join request
      try {
        // Find all notifications related to this request
        const { data: relatedNotifications } = await supabase
          .from('notifications')
          .select('id')
          .eq('club_id', clubId)
          .eq('type', 'join_request')
          .or(`data->requesterId.eq.${requesterId},data->userId.eq.${requesterId}`);
          
        if (relatedNotifications && relatedNotifications.length > 0) {
          // Delete all related notifications
          await supabase
            .from('notifications')
            .delete()
            .in('id', relatedNotifications.map(n => n.id));
            
          console.log(`[useHomeNotifications] Deleted ${relatedNotifications.length} related notifications`);
          
          // Update local state as well
          setNotifications(prev => 
            prev.filter(n => !relatedNotifications.some(rn => rn.id === n.id))
          );
        }
      } catch (notificationError) {
        console.error('[useHomeNotifications] Error handling related notifications:', notificationError);
        // Continue even if notification handling fails
      }
      
      toast.success(`User has been added to the club`);
      
      // Trigger a refresh of user data
      await refreshCurrentUser();
      
      // Dispatch an event to notify that user data has been updated
      window.dispatchEvent(new CustomEvent('userDataUpdated'));
      
    } catch (error) {
      console.error("[useHomeNotifications] Error joining club:", error);
      toast.error("Failed to process club action");
    }
  }, [notifications, currentUser, refreshCurrentUser]);

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
      
      console.log('[useHomeNotifications] Found notification to decline:', notification);
      
      // If this is a join request, delete the request record instead of updating status
      if (notification.type === 'join_request') {
        const requesterId = notification.data?.requesterId || notification.userId;
        const clubId = notification.data?.clubId || notification.clubId;
        
        console.log('[useHomeNotifications] Join request - requesterId:', requesterId, 'clubId:', clubId);
        
        if (!requesterId || !clubId) {
          console.error('[useHomeNotifications] Invalid notification data - missing requesterId or club ID');
          throw new Error("Invalid notification data");
        }
        
        // Delete the join request record
        const { error } = await supabase
          .from('club_requests')
          .delete()
          .eq('user_id', requesterId)
          .eq('club_id', clubId);
          
        if (error) {
          console.error('[useHomeNotifications] Error deleting request:', error);
          throw error;
        }
        
        console.log('[useHomeNotifications] Successfully deleted club request');
        
        // Find and delete all related notifications
        try {
          // Find notifications related to this request
          const { data: relatedNotifications } = await supabase
            .from('notifications')
            .select('id')
            .eq('club_id', clubId)
            .eq('type', 'join_request')
            .or(`data->requesterId.eq.${requesterId},data->userId.eq.${requesterId}`);
            
          if (relatedNotifications && relatedNotifications.length > 0) {
            // Delete all related notifications except the current one (which will be deleted below)
            const otherNotificationIds = relatedNotifications
              .map(n => n.id)
              .filter(nId => nId !== id);
              
            if (otherNotificationIds.length > 0) {
              await supabase
                .from('notifications')
                .delete()
                .in('id', otherNotificationIds);
                
              console.log(`[useHomeNotifications] Deleted ${otherNotificationIds.length} related notifications`);
              
              // Update local state as well
              setNotifications(prev => 
                prev.filter(n => !otherNotificationIds.includes(n.id))
              );
            }
          }
        } catch (notificationError) {
          console.error('[useHomeNotifications] Error handling related notifications:', notificationError);
          // Continue even if this part fails
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
