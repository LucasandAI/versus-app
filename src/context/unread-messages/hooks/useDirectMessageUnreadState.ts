
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from "sonner";

export const useDirectMessageUnreadState = (currentUserId: string | undefined) => {
  const [unreadConversations, setUnreadConversations] = useState<Set<string>>(new Set());
  const [dmUnreadCount, setDmUnreadCount] = useState(0);
  const [unreadMessagesPerConversation, setUnreadMessagesPerConversation] = useState<Record<string, number>>({});

  // Mark conversation as unread (for new incoming messages)
  const markConversationAsUnread = useCallback((conversationId: string) => {
    setUnreadConversations(prev => {
      const updated = new Set(prev);
      if (!updated.has(conversationId)) {
        updated.add(conversationId);
        
        // Update unread messages per conversation
        setUnreadMessagesPerConversation(prev => {
          const updated = { ...prev };
          updated[conversationId] = (updated[conversationId] || 0) + 1;
          return updated;
        });
        
        setDmUnreadCount(prev => prev + 1);
        
        // Dispatch event to notify UI components
        window.dispatchEvent(new CustomEvent('unreadMessagesUpdated'));
      } else {
        // If conversation is already marked as unread, just increment the message count
        setUnreadMessagesPerConversation(prev => {
          const updated = { ...prev };
          updated[conversationId] = (updated[conversationId] || 0) + 1;
          return updated;
        });
        
        setDmUnreadCount(prev => prev + 1);
      }
      return updated;
    });
  }, []);

  // Mark conversation as read
  const markConversationAsRead = useCallback(async (conversationId: string) => {
    if (!currentUserId || !conversationId) return;
    
    // Get the number of unread messages for this conversation
    const messageCount = unreadMessagesPerConversation[conversationId] || 0;
    
    // Optimistically update local state
    setUnreadConversations(prev => {
      if (!prev.has(conversationId)) return prev;
      
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
      
      return updated;
    });
    
    try {
      // Update the read timestamp in the database
      const { error } = await supabase
        .from('direct_messages_read')
        .upsert({
          user_id: currentUserId,
          conversation_id: conversationId,
          last_read_timestamp: new Date().toISOString()
        }, {
          onConflict: 'user_id,conversation_id'
        });
      
      if (error) throw error;
      
    } catch (error) {
      console.error('[useDirectMessageUnreadState] Error marking conversation as read:', error);
      
      // Revert optimistic update on error
      setUnreadConversations(prev => {
        const reverted = new Set(prev);
        reverted.add(conversationId);
        return reverted;
      });
      
      // Restore the unread message count on error
      setUnreadMessagesPerConversation(prev => ({
        ...prev,
        [conversationId]: messageCount
      }));
      
      setDmUnreadCount(prev => prev + messageCount);
      
      // Notify UI components about the revert
      window.dispatchEvent(new CustomEvent('unreadMessagesUpdated'));
      
      toast.error("Failed to mark conversation as read");
    }
  }, [currentUserId, unreadMessagesPerConversation]);

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
