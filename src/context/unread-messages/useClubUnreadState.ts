
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from "sonner";

export function useClubUnreadState(userId: string | undefined) {
  const [unreadClubs, setUnreadClubs] = useState<Set<string>>(new Set());
  const [clubUnreadCount, setClubUnreadCount] = useState(0);

  // Mark club as unread (for new incoming messages)
  const markClubAsUnread = useCallback((clubId: string) => {
    setUnreadClubs(prev => {
      const updated = new Set(prev);
      if (!updated.has(clubId)) {
        updated.add(clubId);
        setClubUnreadCount(prev => prev + 1);
        
        // Dispatch event to notify UI components
        window.dispatchEvent(new CustomEvent('unreadMessagesUpdated'));
      }
      return updated;
    });
  }, []);

  // Mark club messages as read
  const markClubMessagesAsRead = useCallback(async (clubId: string) => {
    if (!userId || !clubId) return;
    
    console.log('[UnreadMessagesContext] Marking club messages as read:', clubId);
    
    // Optimistically update local state
    setUnreadClubs(prev => {
      if (!prev.has(clubId)) return prev;
      
      const updated = new Set(prev);
      updated.delete(clubId);
      setClubUnreadCount(prevCount => Math.max(0, prevCount - 1));
      
      // Dispatch event to notify UI components
      window.dispatchEvent(new CustomEvent('unreadMessagesUpdated'));
      
      return updated;
    });
    
    try {
      // Update the read timestamp in the database
      const { error } = await supabase
        .from('club_messages_read')
        .upsert({
          user_id: userId,
          club_id: clubId,
          last_read_timestamp: new Date().toISOString()
        }, {
          onConflict: 'user_id,club_id'
        });
      
      if (error) throw error;
      
      // Dispatch event to notify other components
      window.dispatchEvent(new CustomEvent('clubMessagesRead', { 
        detail: { clubId } 
      }));
      
    } catch (error) {
      console.error('[UnreadMessagesContext] Error marking club messages as read:', error);
      
      // Revert optimistic update on error
      setUnreadClubs(prev => {
        const reverted = new Set(prev);
        reverted.add(clubId);
        return reverted;
      });
      setClubUnreadCount(prev => prev + 1);
      
      // Notify UI components about the revert
      window.dispatchEvent(new CustomEvent('unreadMessagesUpdated'));
      
      toast.error("Failed to mark club messages as read");
    }
  }, [userId]);

  return {
    unreadClubs,
    setUnreadClubs,
    clubUnreadCount, 
    setClubUnreadCount,
    markClubAsUnread,
    markClubMessagesAsRead
  };
}
