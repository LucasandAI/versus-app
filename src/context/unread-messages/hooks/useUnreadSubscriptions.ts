
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface UseUnreadSubscriptionsProps {
  currentUserId: string | undefined;
  isSessionReady: boolean;
  markConversationAsUnread: (conversationId: string) => void;
  markClubAsUnread: (clubId: string) => void;
  fetchUnreadCounts: () => Promise<void>;
}

export const useUnreadSubscriptions = ({
  currentUserId,
  isSessionReady,
  markConversationAsUnread,
  markClubAsUnread,
  fetchUnreadCounts
}: UseUnreadSubscriptionsProps) => {
  
  useEffect(() => {
    // Skip if not authenticated or session not ready
    if (!isSessionReady || !currentUserId) return;
    
    console.log('[useUnreadSubscriptions] Setting up subscriptions for user', currentUserId);
    
    // Initial fetch
    fetchUnreadCounts();
    
    // Subscribe to new direct messages
    const dmChannel = supabase.channel('dm-notifications')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'direct_messages'
      }, (payload) => {
        // Only mark as unread if the message is for the current user and not from them
        if (payload.new.receiver_id === currentUserId && payload.new.sender_id !== currentUserId) {
          console.log('[useUnreadSubscriptions] New DM received:', payload.new.id);
          
          // Mark conversation as unread and increment count
          markConversationAsUnread(payload.new.conversation_id);
          
          // Dispatch global event for UI updates
          window.dispatchEvent(new CustomEvent('unreadMessagesUpdated'));
        }
      })
      .subscribe();
    
    // Subscribe to club chat messages
    const clubChannel = supabase.channel('club-notifications')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'club_chat_messages'
      }, (payload) => {
        // Only mark as unread if the message is from someone else
        if (payload.new.sender_id !== currentUserId) {
          console.log('[useUnreadSubscriptions] New club message received:', payload.new.id);
          
          // Mark club as unread and increment count
          markClubAsUnread(payload.new.club_id);
          
          // Dispatch global event for UI updates
          window.dispatchEvent(new CustomEvent('unreadMessagesUpdated'));
          window.dispatchEvent(new CustomEvent('clubMessageReceived', { 
            detail: { clubId: payload.new.club_id } 
          }));
        }
      })
      .subscribe();
    
    // Clean up subscriptions when unmounted
    return () => {
      console.log('[useUnreadSubscriptions] Cleaning up subscriptions');
      supabase.removeChannel(dmChannel);
      supabase.removeChannel(clubChannel);
    };
  }, [currentUserId, isSessionReady, fetchUnreadCounts, markConversationAsUnread, markClubAsUnread]);
};
