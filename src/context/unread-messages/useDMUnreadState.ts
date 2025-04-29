
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from "sonner";

export function useDMUnreadState(userId: string | undefined) {
  const [unreadConversations, setUnreadConversations] = useState<Set<string>>(new Set());
  const [dmUnreadCount, setDmUnreadCount] = useState(0);

  // Mark conversation as unread (for new incoming messages)
  const markConversationAsUnread = useCallback((conversationId: string) => {
    setUnreadConversations(prev => {
      const updated = new Set(prev);
      if (!updated.has(conversationId)) {
        updated.add(conversationId);
        setDmUnreadCount(prev => prev + 1);
        
        // Dispatch event to notify UI components
        window.dispatchEvent(new CustomEvent('unreadMessagesUpdated'));
      }
      return updated;
    });
  }, []);

  // Mark conversation as read
  const markConversationAsRead = useCallback(async (conversationId: string) => {
    if (!userId || !conversationId) return;
    
    // Optimistically update local state
    setUnreadConversations(prev => {
      if (!prev.has(conversationId)) return prev;
      
      const updated = new Set(prev);
      updated.delete(conversationId);
      setDmUnreadCount(prevCount => Math.max(0, prevCount - 1));
      
      // Dispatch event to notify UI components
      window.dispatchEvent(new CustomEvent('unreadMessagesUpdated'));
      
      return updated;
    });
    
    try {
      // Update the read timestamp in the database
      const { error } = await supabase
        .from('direct_messages_read')
        .upsert({
          user_id: userId,
          conversation_id: conversationId,
          last_read_timestamp: new Date().toISOString()
        }, {
          onConflict: 'user_id,conversation_id'
        });
      
      if (error) throw error;
      
    } catch (error) {
      console.error('[UnreadMessagesContext] Error marking conversation as read:', error);
      
      // Revert optimistic update on error
      setUnreadConversations(prev => {
        const reverted = new Set(prev);
        reverted.add(conversationId);
        return reverted;
      });
      setDmUnreadCount(prev => prev + 1);
      
      // Notify UI components about the revert
      window.dispatchEvent(new CustomEvent('unreadMessagesUpdated'));
      
      toast.error("Failed to mark conversation as read");
    }
  }, [userId]);

  return {
    unreadConversations,
    setUnreadConversations,
    dmUnreadCount,
    setDmUnreadCount,
    markConversationAsUnread,
    markConversationAsRead
  };
}
