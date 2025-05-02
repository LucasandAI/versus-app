
import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from "sonner";

export const useClubUnreadState = (currentUserId: string | undefined) => {
  const [unreadClubs, setUnreadClubs] = useState<Set<string>>(new Set());
  const [clubUnreadCount, setClubUnreadCount] = useState(0);
  const [unreadMessagesPerClub, setUnreadMessagesPerClub] = useState<Record<string, number>>({});
  
  // Listen for club message received events
  useEffect(() => {
    const handleClubMessageReceived = (e: CustomEvent<{clubId: string}>) => {
      const clubId = e.detail.clubId;
      if (!clubId) return;
      
      console.log(`[useClubUnreadState] Club message received for club: ${clubId}`);
      markClubAsUnread(clubId);
    };
    
    window.addEventListener('clubMessageReceived', handleClubMessageReceived as EventListener);
    
    return () => {
      window.removeEventListener('clubMessageReceived', handleClubMessageReceived as EventListener);
    };
  }, []);

  // Mark club as unread (for new incoming messages)
  const markClubAsUnread = useCallback((clubId: string) => {
    setUnreadClubs(prev => {
      const updated = new Set(prev);
      if (!updated.has(clubId)) {
        updated.add(clubId);
        
        // Update unread messages per club
        setUnreadMessagesPerClub(prev => {
          const updated = { ...prev };
          updated[clubId] = (updated[clubId] || 0) + 1;
          return updated;
        });
        
        setClubUnreadCount(prev => prev + 1);
        
        // Dispatch event to notify UI components
        window.dispatchEvent(new CustomEvent('unreadMessagesUpdated'));
      } else {
        // If club is already marked as unread, just increment the message count
        setUnreadMessagesPerClub(prev => {
          const updated = { ...prev };
          updated[clubId] = (updated[clubId] || 0) + 1;
          return updated;
        });
        
        setClubUnreadCount(prev => prev + 1);
      }
      return updated;
    });
  }, []);

  // Mark club messages as read
  const markClubMessagesAsRead = useCallback(async (clubId: string) => {
    if (!currentUserId || !clubId) return;
    
    // Get the number of unread messages for this club
    const messageCount = unreadMessagesPerClub[clubId] || 0;
    
    // Optimistically update local state
    setUnreadClubs(prev => {
      if (!prev.has(clubId)) return prev;
      
      const updated = new Set(prev);
      updated.delete(clubId);
      
      // Subtract the actual count of unread messages for this club
      setClubUnreadCount(prevCount => Math.max(0, prevCount - messageCount));
      
      // Clear the unread messages count for this club
      setUnreadMessagesPerClub(prev => {
        const updated = { ...prev };
        delete updated[clubId];
        return updated;
      });
      
      // Dispatch event to notify UI components
      window.dispatchEvent(new CustomEvent('unreadMessagesUpdated'));
      
      return updated;
    });
    
    try {
      // Update the read timestamp in the database
      const { error } = await supabase
        .from('club_messages_read')
        .upsert({
          user_id: currentUserId,
          club_id: clubId,
          last_read_timestamp: new Date().toISOString()
        }, {
          onConflict: 'user_id,club_id'
        });
      
      if (error) throw error;
      
    } catch (error) {
      console.error('[useClubUnreadState] Error marking club messages as read:', error);
      
      // Revert optimistic update on error
      setUnreadClubs(prev => {
        const reverted = new Set(prev);
        reverted.add(clubId);
        return reverted;
      });
      
      // Restore the unread message count on error
      setUnreadMessagesPerClub(prev => ({
        ...prev,
        [clubId]: messageCount
      }));
      
      setClubUnreadCount(prev => prev + messageCount);
      
      // Notify UI components about the revert
      window.dispatchEvent(new CustomEvent('unreadMessagesUpdated'));
      
      toast.error("Failed to mark club messages as read");
    }
  }, [currentUserId, unreadMessagesPerClub]);

  return {
    unreadClubs,
    setUnreadClubs,
    clubUnreadCount,
    setClubUnreadCount,
    unreadMessagesPerClub,
    setUnreadMessagesPerClub,
    markClubAsUnread,
    markClubMessagesAsRead
  };
};
