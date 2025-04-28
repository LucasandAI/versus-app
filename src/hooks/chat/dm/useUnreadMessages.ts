
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useApp } from '@/context/AppContext';

export const useUnreadMessages = () => {
  const [unreadConversations, setUnreadConversations] = useState<Set<string>>(new Set());
  const [unreadCount, setUnreadCount] = useState(0);
  const { currentUser } = useApp();

  useEffect(() => {
    if (!currentUser) return;
    
    const fetchUnreadDMs = async () => {
      try {
        // Get unread conversations
        const { data: unreadDMs } = await supabase
          .from('direct_messages_read')
          .select('conversation_id')
          .eq('user_id', currentUser.id)
          .filter('has_unread', 'eq', true);

        setUnreadConversations(new Set(unreadDMs?.map(dm => dm.conversation_id)));
        setUnreadCount(unreadDMs?.length || 0);
      } catch (error) {
        console.error('[useUnreadMessages] Error fetching unread DMs:', error);
      }
    };

    fetchUnreadDMs();
    
    // Setup realtime subscription for new DMs
    const channel = supabase.channel('dm-notifications')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'direct_messages'
      }, (payload) => {
        if (payload.new.receiver_id === currentUser.id) {
          setUnreadCount(prev => prev + 1);
          setUnreadConversations(prev => new Set([...prev, payload.new.conversation_id]));
        }
      })
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUser]);

  // Method to mark conversation as read
  const markConversationAsRead = async (conversationId: string) => {
    if (!currentUser) return;
    
    try {
      // Optimistic UI update
      setUnreadConversations(prev => {
        const updated = new Set(prev);
        if (updated.has(conversationId)) {
          updated.delete(conversationId);
          setUnreadCount(prev => Math.max(0, prev - 1));
        }
        return updated;
      });
      
      // Update in database
      await supabase
        .from('direct_messages_read')
        .upsert({
          user_id: currentUser.id,
          conversation_id: conversationId,
          last_read_timestamp: new Date().toISOString(),
          has_unread: false
        }, { 
          onConflict: 'user_id,conversation_id'
        });
    } catch (error) {
      console.error('[useUnreadMessages] Error marking conversation as read:', error);
    }
  };

  // Expose the method as markDMAsRead for consistency with useUnreadCounts
  const markDMAsRead = markConversationAsRead;

  return {
    unreadConversations,
    totalUnreadCount: unreadCount,
    markConversationAsRead,
    markDMAsRead
  };
};
