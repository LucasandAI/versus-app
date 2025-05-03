
import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from "sonner";

export const useClubUnreadState = (currentUserId: string | undefined) => {
  const [unreadClubs, setUnreadClubs] = useState<Set<string>>(new Set());
  const [clubUnreadCount, setClubUnreadCount] = useState(0);
  const [unreadMessagesPerClub, setUnreadMessagesPerClub] = useState<Record<string, number>>({});
  
  // Listen for global unreadMessagesUpdated events
  useEffect(() => {
    const handleUnreadUpdated = (e: CustomEvent) => {
      console.log('[useClubUnreadState] Detected unreadMessagesUpdated event', e.detail);
      
      // Check if we have clubId in the event detail
      if (e.detail?.clubId) {
        const clubId = e.detail.clubId.toString();
        
        // Mark this club as unread
        markClubAsUnread(clubId);
      }
    };
    
    // Listen for the custom event
    window.addEventListener('unreadMessagesUpdated', handleUnreadUpdated as EventListener);
    
    return () => window.removeEventListener('unreadMessagesUpdated', handleUnreadUpdated as EventListener);
  }, []);  // Empty dependency array ensures this only runs once

  // Mark club as unread (for new incoming messages)
  const markClubAsUnread = useCallback((clubId: string) => {
    console.log(`[useClubUnreadState] Marking club ${clubId} as unread`);
    
    setUnreadClubs(prev => {
      const updated = new Set(prev);
      const normalizedClubId = clubId.toString(); // Convert to string to ensure consistency
      
      if (!updated.has(normalizedClubId)) {
        updated.add(normalizedClubId);
        console.log(`[useClubUnreadState] Club ${normalizedClubId} added to unread set:`, Array.from(updated));
        
        // Update the unread messages count for this club
        setUnreadMessagesPerClub(prev => {
          const updated = { ...prev };
          updated[normalizedClubId] = (updated[normalizedClubId] || 0) + 1;
          return updated;
        });
        
        setClubUnreadCount(prev => prev + 1);
        
        // Dispatch event to notify UI components
        window.dispatchEvent(new CustomEvent('unreadMessagesUpdated'));
      } else {
        console.log(`[useClubUnreadState] Club ${normalizedClubId} was already in unread set`);
        
        // If club is already marked as unread, just increment the message count
        setUnreadMessagesPerClub(prev => {
          const updated = { ...prev };
          updated[normalizedClubId] = (updated[normalizedClubId] || 0) + 1;
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
    
    console.log(`[useClubUnreadState] Marking club ${clubId} messages as read`);
    
    // Get the number of unread messages for this club
    const messageCount = unreadMessagesPerClub[clubId] || 0;
    
    // Optimistically update local state
    setUnreadClubs(prev => {
      if (!prev.has(clubId)) {
        console.log(`[useClubUnreadState] Club ${clubId} not in unread set:`, Array.from(prev));
        return prev;
      }
      
      const updated = new Set(prev);
      updated.delete(clubId);
      console.log(`[useClubUnreadState] Club ${clubId} removed from unread set:`, Array.from(updated));
      
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
      const normalizedClubId = clubId.toString(); // Ensure it's a string
      console.log(`[useClubUnreadState] Updating read timestamp for club ${normalizedClubId} in database`);
      
      const { error } = await supabase
        .from('club_messages_read')
        .upsert({
          user_id: currentUserId,
          club_id: normalizedClubId,
          last_read_timestamp: new Date().toISOString()
        }, {
          onConflict: 'user_id,club_id'
        });
      
      if (error) {
        console.error(`[useClubUnreadState] Error updating club_messages_read:`, error);
        throw error;
      }
      
      // Dispatch event to notify other components
      window.dispatchEvent(new CustomEvent('clubMessagesRead', { 
        detail: { clubId } 
      }));
      
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
