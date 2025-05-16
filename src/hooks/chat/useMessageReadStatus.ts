
import { useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useUnreadMessages } from '@/context/unread-messages';
import { toast } from '@/hooks/use-toast';

export const useMessageReadStatus = () => {
  const { markDirectConversationAsRead, markClubMessagesAsRead } = useUnreadMessages();
  
  // Track ongoing operations to prevent duplicates
  const pendingOperations = useRef<Record<string, boolean>>({});
  
  // Add debounce timers
  const debounceTimers = useRef<Record<string, NodeJS.Timeout>>({});

  const markDirectMessagesAsRead = useCallback(async (conversationId: string, userId: string, delay = 0) => {
    // If operation for this conversation is already in progress, skip
    const operationKey = `dm-${conversationId}`;
    if (pendingOperations.current[operationKey]) {
      console.log(`[useMessageReadStatus] Operation already in progress for conversation ${conversationId}, skipping`);
      return;
    }
    
    // Clear any existing timer for this conversation
    if (debounceTimers.current[operationKey]) {
      clearTimeout(debounceTimers.current[operationKey]);
    }
    
    // Set the conversation as active to prevent new messages from being marked as unread
    window.dispatchEvent(new CustomEvent('conversationActive', { 
      detail: { conversationId } 
    }));

    // Mark operation as pending
    pendingOperations.current[operationKey] = true;

    // Use debounce to prevent multiple rapid calls
    debounceTimers.current[operationKey] = setTimeout(async () => {
      try {
        // Immediately dispatch an event to update badge counts (optimistic update)
        window.dispatchEvent(new CustomEvent('unreadMessagesUpdated', { 
          detail: { timestamp: Date.now(), conversationId }
        }));
        
        // Use the context method for the actual database update
        await markDirectConversationAsRead(conversationId);
        
        // Broadcast that messages have been read to ensure UI consistency
        window.dispatchEvent(new CustomEvent('messagesMarkedAsRead', { 
          detail: { conversationId, type: 'dm' } 
        }));
      } catch (error) {
        console.error('[useMessageReadStatus] Error marking DM as read:', error);
        toast({
          title: "Failed to mark messages as read",
          description: "Please try again later",
          variant: "destructive"
        });
      } finally {
        // Clear pending operation flag
        pendingOperations.current[operationKey] = false;
      }
    }, delay);
    
  }, [markDirectConversationAsRead]);

  const markClubMessagesAsRead = useCallback(async (clubId: string, userId: string, delay = 0) => {
    // If operation for this club is already in progress, skip
    const operationKey = `club-${clubId}`;
    if (pendingOperations.current[operationKey]) {
      console.log(`[useMessageReadStatus] Operation already in progress for club ${clubId}, skipping`);
      return;
    }
    
    // Clear any existing timer for this club
    if (debounceTimers.current[operationKey]) {
      clearTimeout(debounceTimers.current[operationKey]);
    }
    
    // Set the club as active to prevent new messages from being marked as unread
    window.dispatchEvent(new CustomEvent('clubActive', { 
      detail: { clubId } 
    }));

    // Mark operation as pending
    pendingOperations.current[operationKey] = true;

    // Use debounce to prevent multiple rapid calls
    debounceTimers.current[operationKey] = setTimeout(async () => {
      try {
        // Immediately dispatch an event to update badge counts (optimistic update)
        window.dispatchEvent(new CustomEvent('unreadMessagesUpdated', { 
          detail: { timestamp: Date.now(), clubId }
        }));
        
        // Use the context method for the actual database update
        await markClubMessagesAsRead(clubId);
        
        // Broadcast that messages have been read to ensure UI consistency
        window.dispatchEvent(new CustomEvent('messagesMarkedAsRead', { 
          detail: { clubId, type: 'club' } 
        }));
      } catch (error) {
        console.error('[useMessageReadStatus] Error marking club messages as read:', error);
        toast({
          title: "Failed to mark messages as read",
          description: "Please try again later",
          variant: "destructive"
        });
      } finally {
        // Clear pending operation flag
        pendingOperations.current[operationKey] = false;
      }
    }, delay);
    
  }, [markClubMessagesAsRead]);

  return {
    markDirectMessagesAsRead,
    markClubMessagesAsRead
  };
};
