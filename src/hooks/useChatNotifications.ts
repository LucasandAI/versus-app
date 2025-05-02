
import { useEffect } from 'react';
import { useUnreadMessages } from '@/context/unread-messages';
import { supabase } from '@/integrations/supabase/client';
import { useApp } from '@/context/AppContext';

interface UseChatNotificationsProps {
  setChatNotifications: (count: number) => void;
}

export const useChatNotifications = ({ setChatNotifications }: UseChatNotificationsProps) => {
  const { totalUnreadCount, markClubAsUnread, fetchUnreadCounts } = useUnreadMessages();
  const { currentUser, isSessionReady } = useApp();
  
  // Update the chat notification count whenever totalUnreadCount changes
  useEffect(() => {
    setChatNotifications(totalUnreadCount);
  }, [totalUnreadCount, setChatNotifications]);
  
  // Set up real-time subscription for club chat messages
  useEffect(() => {
    // Skip if not authenticated or session not ready
    if (!isSessionReady || !currentUser?.id) return;
    
    console.log('[useChatNotifications] Setting up club chat subscription');
    
    // Initial fetch of unread counts
    fetchUnreadCounts().catch(err => {
      console.error('[useChatNotifications] Error fetching unread counts:', err);
    });
    
    const channel = supabase
      .channel('club-chat-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'club_chat_messages'
        },
        (payload) => {
          console.log('[useChatNotifications] New club chat message:', payload);
          
          // Only mark as unread if the message is from someone else
          if (payload.new && payload.new.sender_id !== currentUser.id) {
            const clubId = payload.new.club_id;
            console.log(`[useChatNotifications] Marking club ${clubId} as unread`);
            markClubAsUnread(clubId);
          }
        }
      )
      .subscribe((status) => {
        console.log('[useChatNotifications] Club chat subscription status:', status);
      });
    
    return () => {
      console.log('[useChatNotifications] Cleaning up club chat subscription');
      supabase.removeChannel(channel);
    };
  }, [currentUser?.id, isSessionReady, markClubAsUnread, fetchUnreadCounts]);
};
