import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useApp } from '@/context/AppContext';
import { toast } from "sonner";

export const useUnreadMessages = () => {
  const [unreadConversations, setUnreadConversations] = useState<Set<string>>(new Set());
  const [totalUnreadCount, setTotalUnreadCount] = useState<number>(0);
  const { currentUser } = useApp();

  // Fetch initial unread status
  useEffect(() => {
    if (!currentUser?.id) return;
    
    const fetchUnreadStatus = async () => {
      try {
        // First get all conversations
        const { data: conversations } = await supabase
          .from('direct_conversations')
          .select('id')
          .or(`user1_id.eq.${currentUser.id},user2_id.eq.${currentUser.id}`);
          
        if (!conversations?.length) return;
        
        const conversationIds = conversations.map(c => c.id);
        
        // Then fetch latest message for each conversation
        const { data: latestMessages } = await supabase
          .from('direct_messages')
          .select('conversation_id, sender_id, timestamp')
          .in('conversation_id', conversationIds)
          .order('timestamp', { ascending: false })
          .limit(conversationIds.length);
          
        if (!latestMessages?.length) return;
        
        // Group by conversation to get latest message per conversation
        const latestMessageByConversation: Record<string, {sender_id: string, timestamp: string}> = {};
        latestMessages.forEach(message => {
          if (!latestMessageByConversation[message.conversation_id] ||
              new Date(message.timestamp) > new Date(latestMessageByConversation[message.conversation_id].timestamp)) {
            latestMessageByConversation[message.conversation_id] = {
              sender_id: message.sender_id,
              timestamp: message.timestamp
            };
          }
        });
        
        // Get read timestamps
        const { data: readTimestamps } = await supabase
          .from('direct_messages_read')
          .select('conversation_id, last_read_timestamp')
          .eq('user_id', currentUser.id)
          .in('conversation_id', conversationIds);
          
        const readTimestampByConversation: Record<string, string> = {};
        if (readTimestamps) {
          readTimestamps.forEach(rt => {
            readTimestampByConversation[rt.conversation_id] = rt.last_read_timestamp;
          });
        }
        
        // Calculate unread status
        const unreadConvs = new Set<string>();
        let unreadCount = 0;
        
        Object.entries(latestMessageByConversation).forEach(([conversationId, message]) => {
          // If message is from someone else and either no read timestamp or read timestamp is older
          if (message.sender_id !== currentUser.id && 
              (!readTimestampByConversation[conversationId] || 
               new Date(message.timestamp) > new Date(readTimestampByConversation[conversationId]))) {
            unreadConvs.add(conversationId);
            unreadCount++;
          }
        });
        
        setUnreadConversations(unreadConvs);
        setTotalUnreadCount(unreadCount);
        
      } catch (error) {
        console.error('[useUnreadMessages] Error fetching unread status:', error);
      }
    };
    
    fetchUnreadStatus();
    
    // Set up real-time subscription for new messages
    const channel = supabase
      .channel('dm-unread-tracking')
      .on('postgres_changes', 
          { 
            event: 'INSERT', 
            schema: 'public', 
            table: 'direct_messages' 
          },
          (payload) => {
            if (payload.new.receiver_id === currentUser.id) {
              setUnreadConversations(prev => {
                const updated = new Set(prev);
                updated.add(payload.new.conversation_id);
                return updated;
              });
              setTotalUnreadCount(prev => prev + 1);
            }
          })
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUser?.id]);

  // Optimistically mark conversation as read
  const markConversationAsRead = useCallback(async (conversationId: string) => {
    if (!currentUser?.id || !conversationId) return;
    
    // Optimistically update local state
    setUnreadConversations(prev => {
      const updated = new Set(prev);
      updated.delete(conversationId);
      return updated;
    });
    setTotalUnreadCount(prev => Math.max(0, prev - 1));

    // Dispatch event to update global unread count
    const event = new CustomEvent('unreadMessagesUpdated');
    window.dispatchEvent(event);
    
    try {
      // Update the read timestamp in the database
      const { error } = await supabase
        .from('direct_messages_read')
        .upsert({
          user_id: currentUser.id,
          conversation_id: conversationId,
          last_read_timestamp: new Date().toISOString()
        }, {
          onConflict: 'user_id,conversation_id'
        });
      
      if (error) throw error;
      
    } catch (error) {
      console.error('[useUnreadMessages] Error marking conversation as read:', error);
      
      // Revert optimistic update on error
      setUnreadConversations(prev => {
        const reverted = new Set(prev);
        reverted.add(conversationId);
        return reverted;
      });
      setTotalUnreadCount(prev => prev + 1);
      
      toast.error("Failed to mark conversation as read");
    }
  }, [currentUser?.id]);

  return {
    unreadConversations,
    totalUnreadCount,
    markConversationAsRead
  };
};
