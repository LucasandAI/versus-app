
import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useApp } from '@/context/AppContext';
import { Notification } from '@/types';

export const useHomeNotifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadMessages, setUnreadMessages] = useState<Record<string, number>>({});
  const { currentUser } = useApp();

  const handleMarkAsRead = useCallback(async (id: string) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === id ? { ...notification, read: true } : notification
      )
    );
    
    try {
      if (!currentUser?.id) return;

      // Update notification in Supabase
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .match({ id, user_id: currentUser.id });
      
      if (error) throw error;
      
      // Update local storage for offline access
      const updatedNotifications = notifications.map(notification => 
        notification.id === id ? { ...notification, read: true } : notification
      );
      localStorage.setItem('notifications', JSON.stringify(updatedNotifications));
      
      // Dispatch event to update other parts of the UI
      const event = new CustomEvent('notificationsUpdated');
      window.dispatchEvent(event);
    } catch (error) {
      console.error("Error marking notification as read:", error);
      toast.error("Failed to mark notification as read");
    }
  }, [notifications, currentUser?.id]);

  const handleDeclineInvite = useCallback(async (id: string) => {
    try {
      if (!currentUser?.id) return;
      
      const notification = notifications.find(n => n.id === id);
      if (!notification || !notification.data?.invite_id) {
        throw new Error("Invalid invitation data");
      }
      
      // Update invitation status in Supabase
      const { error: inviteError } = await supabase
        .from('club_invites')
        .update({ status: 'declined' })
        .match({ id: notification.data.invite_id });
      
      if (inviteError) throw inviteError;
      
      // Mark notification as read
      const { error: notifError } = await supabase
        .from('notifications')
        .update({ status: 'declined', read: true })
        .match({ id });
      
      if (notifError) throw notifError;
      
      // Update local state
      setNotifications(prev => prev.filter(notification => notification.id !== id));
      
      // Update local storage
      const updatedNotifications = notifications.filter(notification => notification.id !== id);
      localStorage.setItem('notifications', JSON.stringify(updatedNotifications));
      
      // Notify the UI
      window.dispatchEvent(new CustomEvent('notificationsUpdated'));
      toast.success("Invitation declined");
      
    } catch (error) {
      console.error("Error declining invitation:", error);
      toast.error("Failed to decline invitation");
    }
  }, [notifications, currentUser?.id]);

  const handleClearAllNotifications = useCallback(async () => {
    try {
      if (!currentUser?.id) return;
      
      // Mark all notifications as read in Supabase
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', currentUser.id);
      
      if (error) throw error;
      
      // Update local state
      setNotifications([]);
      
      // Update local storage
      localStorage.setItem('notifications', JSON.stringify([]));
      
      // Notify the UI
      window.dispatchEvent(new CustomEvent('notificationsUpdated'));
      toast.success("All notifications cleared");
      
    } catch (error) {
      console.error("Error clearing notifications:", error);
      toast.error("Failed to clear notifications");
    }
  }, [currentUser?.id]);

  return {
    notifications,
    setNotifications,
    unreadMessages,
    setUnreadMessages,
    handleMarkAsRead,
    handleDeclineInvite,
    handleClearAllNotifications
  };
};
