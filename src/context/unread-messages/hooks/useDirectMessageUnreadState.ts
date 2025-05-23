
import { useState, useCallback } from 'react';
import { markDmReadLocally, isDmReadSince } from '@/utils/chat/readStatusStorage';
import { forceSyncItems } from '@/utils/chat/readStatusSyncService';
import { toast } from "sonner";

export const useDirectMessageUnreadState = (currentUserId: string | undefined) => {
  const [unreadConversations, setUnreadConversations] = useState<Set<string>>(new Set());
  const [dmUnreadCount, setDmUnreadCount] = useState(0);
  const [unreadMessagesPerConversation, setUnreadMessagesPerConversation] = useState<Record<string, number>>({});
  const [pendingUpdates, setPendingUpdates] = useState<Record<string, boolean>>({});

  // Mark conversation as unread (for new incoming messages)
  const markConversationAsUnread = useCallback((conversationId: string, messageTimestamp?: number) => {
    // Validate the conversationId
    if (!conversationId || typeof conversationId !== 'string' || !conversationId.trim()) {
      console.error(`[useDirectMessageUnreadState] Invalid conversationId: ${conversationId}, cannot mark as unread`);
      return;
    }
    
    // If we have a timestamp, check if this conversation has already been read more recently
    if (messageTimestamp && isDmReadSince(conversationId, messageTimestamp)) {
      console.log(`[useDirectMessageUnreadState] DM ${conversationId} was read more recently than message timestamp, not marking as unread`);
      return;
    }
    
    setUnreadConversations(prev => {
      const updated = new Set(prev);
      const normalizedId = conversationId.toString(); // Ensure consistency
      
      if (!updated.has(normalizedId)) {
        updated.add(normalizedId);
        
        // Update unread messages per conversation
        setUnreadMessagesPerConversation(prev => {
          const updated = { ...prev };
          updated[normalizedId] = (updated[normalizedId] || 0) + 1;
          return updated;
        });
        
        setDmUnreadCount(prev => prev + 1);
        
        // Dispatch event to notify UI components
        window.dispatchEvent(new CustomEvent('unreadMessagesUpdated'));
      } else {
        // If conversation is already marked as unread, just increment the message count
        setUnreadMessagesPerConversation(prev => {
          const updated = { ...prev };
          updated[normalizedId] = (updated[normalizedId] || 0) + 1;
          return updated;
        });
        
        setDmUnreadCount(prev => prev + 1);
      }
      return updated;
    });
  }, []);

  // Mark conversation as read - optimistic approach with local-first strategy
  const markConversationAsRead = useCallback(async (conversationId: string, forceDatabaseSync = false) => {
    // Validate inputs
    if (!currentUserId || !conversationId || typeof conversationId !== 'string' || !conversationId.trim()) {
      console.error(`[useDirectMessageUnreadState] Invalid parameters - userId: ${currentUserId}, conversationId: ${conversationId}`);
      return;
    }
    
    // Check if there's already a pending update for this conversation
    if (pendingUpdates[conversationId]) {
      console.log(`[useDirectMessageUnreadState] Update for conversation ${conversationId} already in progress, skipping`);
      return;
    }
    
    // Set this update as pending
    setPendingUpdates(prev => ({ ...prev, [conversationId]: true }));
    
    try {
      // Get the number of unread messages for this conversation
      const messageCount = unreadMessagesPerConversation[conversationId] || 0;
      
      // Optimistically update local state first - this provides immediate UI feedback
      setUnreadConversations(prev => {
        if (!prev.has(conversationId)) {
          console.log(`[useDirectMessageUnreadState] Conversation ${conversationId} not in unread set`);
          return prev;
        }
        
        const updated = new Set(prev);
        updated.delete(conversationId);
        
        // Subtract the actual count of unread messages for this conversation
        setDmUnreadCount(prevCount => Math.max(0, prevCount - messageCount));
        
        // Clear the unread messages count for this conversation
        setUnreadMessagesPerConversation(prev => {
          const updated = { ...prev };
          delete updated[conversationId];
          return updated;
        });
        
        // Dispatch event to notify UI components
        window.dispatchEvent(new CustomEvent('unreadMessagesUpdated'));
        window.dispatchEvent(new CustomEvent('dm-read-status-changed', { 
          detail: { conversationId } 
        }));
        
        return updated;
      });
      
      // Mark as read locally first
      markDmReadLocally(conversationId);
      
      // If forceDatabaseSync is true, sync with database now
      if (forceDatabaseSync) {
        await forceSyncItems(currentUserId, [{ type: 'dm', id: conversationId }]);
      }
      
    } catch (error) {
      console.error('[useDirectMessageUnreadState] Error marking conversation as read:', error);
      
      // Only show toast error for forced syncs
      if (forceDatabaseSync) {
        toast.error("Failed to mark conversation as read", {
          id: `dm-read-error-${conversationId}`,
          duration: 3000
        });
      }
    } finally {
      // Always clear the pending status
      setPendingUpdates(prev => {
        const updated = { ...prev };
        delete updated[conversationId];
        return updated;
      });
    }
  }, [currentUserId, unreadMessagesPerConversation, pendingUpdates]);

  return {
    unreadConversations,
    setUnreadConversations,
    dmUnreadCount,
    setDmUnreadCount,
    unreadMessagesPerConversation,
    setUnreadMessagesPerConversation,
    markConversationAsUnread,
    markConversationAsRead
  };
};
