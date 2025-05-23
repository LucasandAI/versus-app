
import { useState, useCallback } from 'react';
import { markClubReadLocally, isClubReadSince } from '@/utils/chat/readStatusStorage';
import { forceSyncItems } from '@/utils/chat/readStatusSyncService';
import { toast } from "sonner";

export const useClubUnreadState = (currentUserId: string | undefined) => {
  const [unreadClubs, setUnreadClubs] = useState<Set<string>>(new Set());
  const [clubUnreadCount, setClubUnreadCount] = useState(0);
  const [unreadMessagesPerClub, setUnreadMessagesPerClub] = useState<Record<string, number>>({});
  const [pendingUpdates, setPendingUpdates] = useState<Record<string, boolean>>({});
  
  // Mark club as unread (for new incoming messages)
  const markClubAsUnread = useCallback((clubId: string, messageTimestamp?: number) => {
    if (!clubId || typeof clubId !== 'string' || !clubId.trim()) {
      console.error(`[useClubUnreadState] Invalid clubId: ${clubId}, cannot mark as unread`);
      return;
    }
    
    // If we have a timestamp, check if this club has already been read more recently
    if (messageTimestamp && isClubReadSince(clubId, messageTimestamp)) {
      console.log(`[useClubUnreadState] Club ${clubId} was read more recently than message timestamp, not marking as unread`);
      return;
    }
    
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

  // Mark club messages as read - optimistic approach with local-first strategy
  const markClubMessagesAsRead = useCallback(async (clubId: string, forceDatabaseSync = false) => {
    // Validate inputs
    if (!currentUserId || !clubId || typeof clubId !== 'string' || !clubId.trim()) {
      console.error(`[useClubUnreadState] Invalid parameters - userId: ${currentUserId}, clubId: ${clubId}`);
      return;
    }
    
    // Check if there's already a pending update for this club
    if (pendingUpdates[clubId]) {
      console.log(`[useClubUnreadState] Update for club ${clubId} already in progress, skipping`);
      return;
    }
    
    console.log(`[useClubUnreadState] Marking club ${clubId} messages as read`);
    
    // Set this update as pending
    setPendingUpdates(prev => ({ ...prev, [clubId]: true }));
    
    try {
      // Get the number of unread messages for this club
      const messageCount = unreadMessagesPerClub[clubId] || 0;
      
      // Optimistically update local state first
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
        window.dispatchEvent(new CustomEvent('club-read-status-changed', { 
          detail: { clubId } 
        }));
        
        return updated;
      });
      
      // Mark as read locally first
      markClubReadLocally(clubId);
      
      // If forceDatabaseSync is true, sync with database now
      if (forceDatabaseSync) {
        await forceSyncItems(currentUserId, [{ type: 'club', id: clubId }]);
      }
      
    } catch (error) {
      console.error('[useClubUnreadState] Error marking club messages as read:', error);
      
      // Only show toast error for forced syncs
      if (forceDatabaseSync) {
        toast.error("Failed to mark club messages as read", {
          id: `club-read-error-${clubId}`,
          duration: 3000
        });
      }
    } finally {
      // Always clear the pending status
      setPendingUpdates(prev => {
        const updated = { ...prev };
        delete updated[clubId];
        return updated;
      });
    }
  }, [currentUserId, unreadMessagesPerClub, pendingUpdates]);

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
