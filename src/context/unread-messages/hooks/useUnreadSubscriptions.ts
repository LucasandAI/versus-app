
import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { isConversationActive } from '@/utils/chat/activeConversationTracker';
import { isClubReadSince, isDmReadSince } from '@/utils/chat/readStatusStorage';

interface UseUnreadSubscriptionsProps {
  currentUserId: string | undefined;
  isSessionReady: boolean;
  markConversationAsUnread: (conversationId: string, messageTimestamp?: number) => void;
  markClubAsUnread: (clubId: string, messageTimestamp?: number) => void;
  fetchUnreadCounts: () => Promise<void>;
}

export const useUnreadSubscriptions = ({
  currentUserId,
  isSessionReady,
  markConversationAsUnread,
  markClubAsUnread,
  fetchUnreadCounts
}: UseUnreadSubscriptionsProps) => {
  
  // Use refs to store handler functions to avoid closures with stale data
  const handlersRef = useRef({
    markConversationAsUnread,
    markClubAsUnread,
    fetchUnreadCounts
  });

  // Update refs when handlers change
  useEffect(() => {
    handlersRef.current = {
      markConversationAsUnread,
      markClubAsUnread,
      fetchUnreadCounts
    };
  }, [markConversationAsUnread, markClubAsUnread, fetchUnreadCounts]);
  
  useEffect(() => {
    if (!isSessionReady || !currentUserId) return;
    
    console.log('[useUnreadSubscriptions] Setting up realtime subscriptions for user:', currentUserId);
    
    // Use local micro-batching for unread updates to prevent cascading re-renders
    let pendingUpdates = new Set<{ id: string, timestamp?: number }>();
    let pendingClubUpdates = new Set<{ id: string, timestamp?: number }>();
    let updateTimeout: NodeJS.Timeout | null = null;
    
    // Batch-process updates with RAF to avoid flickering
    const processUpdates = () => {
      if (pendingUpdates.size > 0) {
        pendingUpdates.forEach(update => {
          // Double-check if conversation is active before marking as unread
          if (!isConversationActive('dm', update.id)) {
            // Also check if it's been read locally since this message
            if (!update.timestamp || !isDmReadSince(update.id, update.timestamp)) {
              handlersRef.current.markConversationAsUnread(update.id, update.timestamp);
            }
          }
        });
        pendingUpdates.clear();
      }
      
      if (pendingClubUpdates.size > 0) {
        pendingClubUpdates.forEach(update => {
          // Double-check if club conversation is active before marking as unread
          if (!isConversationActive('club', update.id)) {
            // Also check if it's been read locally since this message
            if (!update.timestamp || !isClubReadSince(update.id, update.timestamp)) {
              handlersRef.current.markClubAsUnread(update.id, update.timestamp);
            }
          }
        });
        pendingClubUpdates.clear();
      }
      
      // Only dispatch one event regardless of how many updates
      if (pendingUpdates.size > 0 || pendingClubUpdates.size > 0) {
        window.dispatchEvent(new CustomEvent('unreadMessagesUpdated'));
      }
      
      updateTimeout = null;
    };
    
    // Queue an update with debouncing
    const queueUpdate = () => {
      if (updateTimeout) return;
      updateTimeout = setTimeout(() => {
        requestAnimationFrame(processUpdates);
      }, 100);
    };
    
    // Set up real-time subscriptions for new messages
    const dmChannel = supabase
      .channel('global-dm-unread-tracking')
      .on('postgres_changes', 
          { 
            event: 'INSERT', 
            schema: 'public', 
            table: 'direct_messages' 
          },
          (payload) => {
            if (payload.new.receiver_id === currentUserId && payload.new.sender_id !== currentUserId) {
              console.log('[useUnreadSubscriptions] New DM detected:', payload.new.id);
              // Extract timestamp from the message
              const timestamp = new Date(payload.new.created_at || payload.new.timestamp).getTime();
              
              // Queue the update instead of processing immediately
              pendingUpdates.add({
                id: payload.new.conversation_id,
                timestamp
              });
              queueUpdate();
            }
          })
      .subscribe();
    
    // Subscribe to new club messages
    const clubChannel = supabase.channel('global-club-unread-tracking')
      .on('postgres_changes', 
          { 
            event: 'INSERT', 
            schema: 'public', 
            table: 'club_chat_messages'
          },
          (payload) => {
            if (payload.new.sender_id !== currentUserId) {
              console.log('[useUnreadSubscriptions] New club message detected:', payload.new.id);
              // Extract timestamp from the message
              const timestamp = new Date(payload.new.created_at || payload.new.timestamp).getTime();
              
              // Queue the update instead of processing immediately
              pendingClubUpdates.add({
                id: payload.new.club_id,
                timestamp
              });
              queueUpdate();
            }
          })
      .subscribe();
      
    // Initial fetch of unread counts
    handlersRef.current.fetchUnreadCounts();
      
    return () => {
      supabase.removeChannel(dmChannel);
      supabase.removeChannel(clubChannel);
      
      if (updateTimeout) {
        clearTimeout(updateTimeout);
      }
    };
  }, [currentUserId, isSessionReady]);
};
