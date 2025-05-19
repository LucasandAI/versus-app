
import { useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useUnreadMessages } from '@/context/unread-messages';
import { toast } from '@/hooks/use-toast';
import { useApp } from '@/context/app/AppContext';

// Cooldown time in ms before allowing another update for the same conversation/club
const UPDATE_COOLDOWN = 2000;

export const useCoalescedReadStatus = () => {
  const { currentUser } = useApp();
  const { markDirectConversationAsRead, markClubMessagesAsRead } = useUnreadMessages();
  const pendingUpdates = useRef<Record<string, number>>({});

  // Handle club messages read status with debouncing
  const markClubAsRead = useCallback(async (clubId: string) => {
    if (!currentUser?.id || !clubId) return;

    const key = `club_${clubId}`;
    const now = Date.now();
    const lastUpdate = pendingUpdates.current[key] || 0;

    // Apply optimistic UI update immediately
    markClubMessagesAsRead(clubId);
    
    // Dispatch event to notify about messages being read
    window.dispatchEvent(new CustomEvent('messagesMarkedAsRead', { 
      detail: { type: 'club', id: clubId } 
    }));

    // Skip database update if we recently updated this conversation
    if (now - lastUpdate < UPDATE_COOLDOWN) {
      console.log(`[useCoalescedReadStatus] Skipping club read update for ${clubId} (cooldown)`);
      return;
    }

    // Update reference time
    pendingUpdates.current[key] = now;
    
    // Update in database (but don't block UI)
    console.log(`[useCoalescedReadStatus] Marking club messages as read in DB: ${clubId}`);
    try {
      const { error } = await supabase.from('club_messages_read')
        .upsert({
          club_id: clubId,
          user_id: currentUser.id,
          last_read_timestamp: new Date().toISOString()
        });
      
      if (error) {
        // Only show toast for non-duplicate key violations
        if (!error.message.includes('duplicate key')) {
          console.error('[useCoalescedReadStatus] Error marking club messages as read:', error);
          toast({
            title: "Error",
            description: "Could not update read status",
            variant: "destructive"
          });
        } else {
          // Log duplicate key violations but don't show toast
          console.log('[useCoalescedReadStatus] Duplicate club read update (ignored):', error.message);
        }
      } else {
        // Success - refresh unread counts
        window.dispatchEvent(new CustomEvent('unreadMessagesUpdated', { 
          detail: { type: 'club', id: clubId, action: 'read' } 
        }));
      }
    } catch (error) {
      console.error('[useCoalescedReadStatus] Error in club read update:', error);
    }
  }, [currentUser?.id, markClubMessagesAsRead]);

  // Handle DM conversation read status with debouncing
  const markConversationAsRead = useCallback(async (conversationId: string) => {
    if (!currentUser?.id || !conversationId || conversationId === 'new') return;
    
    const key = `dm_${conversationId}`;
    const now = Date.now();
    const lastUpdate = pendingUpdates.current[key] || 0;

    // Apply optimistic UI update immediately
    markDirectConversationAsRead(conversationId);
    
    // Dispatch event to notify about messages being read
    window.dispatchEvent(new CustomEvent('messagesMarkedAsRead', { 
      detail: { type: 'dm', id: conversationId } 
    }));

    // Skip database update if we recently updated this conversation
    if (now - lastUpdate < UPDATE_COOLDOWN) {
      console.log(`[useCoalescedReadStatus] Skipping DM read update for ${conversationId} (cooldown)`);
      return;
    }

    // Update reference time
    pendingUpdates.current[key] = now;
    
    // Update in database (but don't block UI)
    console.log(`[useCoalescedReadStatus] Marking DM conversation as read in DB: ${conversationId}`);
    try {
      const { error } = await supabase.from('direct_messages_read')
        .upsert({
          conversation_id: conversationId,
          user_id: currentUser.id,
          last_read_timestamp: new Date().toISOString()
        });
      
      if (error) {
        // Only show toast for non-duplicate key violations
        if (!error.message.includes('duplicate key')) {
          console.error('[useCoalescedReadStatus] Error marking conversation as read:', error);
          toast({
            title: "Error",
            description: "Could not update read status",
            variant: "destructive"
          });
        } else {
          // Log duplicate key violations but don't show toast
          console.log('[useCoalescedReadStatus] Duplicate DM read update (ignored):', error.message);
        }
      } else {
        // Success - refresh unread counts
        window.dispatchEvent(new CustomEvent('unreadMessagesUpdated', { 
          detail: { type: 'dm', id: conversationId, action: 'read' } 
        }));
      }
    } catch (error) {
      console.error('[useCoalescedReadStatus] Error in DM read update:', error);
    }
  }, [currentUser?.id, markDirectConversationAsRead]);

  return {
    markClubAsRead,
    markConversationAsRead
  };
};
