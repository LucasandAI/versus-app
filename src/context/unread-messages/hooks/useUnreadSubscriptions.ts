import { useEffect, useRef } from 'react';
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
  
  // Use refs to store handler functions to avoid closures with stale data
  const handlersRef = useRef({
    markConversationAsUnread,
    markClubAsUnread,
    fetchUnreadCounts
  });

  // Keep track of active conversation
  const activeConversationRef = useRef<{ type: 'club' | 'dm' | null, id: string | null }>({
    type: null,
    id: null
  });

  // Update refs when handlers change
  useEffect(() => {
    handlersRef.current = {
      markConversationAsUnread,
      markClubAsUnread,
      fetchUnreadCounts
    };
  }, [markConversationAsUnread, markClubAsUnread, fetchUnreadCounts]);
  
  // Listen for active conversation changes
  useEffect(() => {
    const handleActiveConversationChanged = (event: CustomEvent) => {
      console.log('[useUnreadSubscriptions] Active conversation changed:', event.detail);
      activeConversationRef.current = {
        type: event.detail.type,
        id: event.detail.id
      };
    };
    
    // Listen for active conversation changes
    window.addEventListener('activeConversationChanged', handleActiveConversationChanged as EventListener);
    
    // Listen for messages being marked as read
    const handleMessagesMarkedAsRead = (event: CustomEvent) => {
      console.log('[useUnreadSubscriptions] Messages marked as read:', event.detail);
      // No need to do anything here as the handlers will update the UI
    };
    
    window.addEventListener('messagesMarkedAsRead', handleMessagesMarkedAsRead as EventListener);
    
    return () => {
      window.removeEventListener('activeConversationChanged', handleActiveConversationChanged as EventListener);
      window.removeEventListener('messagesMarkedAsRead', handleMessagesMarkedAsRead as EventListener);
    };
  }, []);
  
  useEffect(() => {
    if (!isSessionReady || !currentUserId) return;
    
    console.log('[useUnreadSubscriptions] Setting up realtime subscriptions for user:', currentUserId);
    
    // Use local micro-batching for unread updates to prevent cascading re-renders
    let pendingUpdates = new Set<string>();
    let pendingClubUpdates = new Set<string>();
    let updateTimeout: NodeJS.Timeout | null = null;
    
    // Batch-process updates with RAF to avoid flickering
    const processUpdates = () => {
      if (pendingUpdates.size > 0) {
        pendingUpdates.forEach(conversationId => {
          // Check if this is the active conversation
          if (
            activeConversationRef.current.type === 'dm' && 
            activeConversationRef.current.id === conversationId
          ) {
            console.log(`[useUnreadSubscriptions] Skipping unread update for active conversation: ${conversationId}`);
            
            // Mark as read optimistically in database
            if (currentUserId) {
              // Fix: Use .then().then(null, error) pattern instead of .catch()
              supabase.from('direct_messages_read')
                .upsert({
                  conversation_id: conversationId,
                  user_id: currentUserId,
                  last_read_timestamp: new Date().toISOString()
                })
                .then(() => {
                  console.log(`[useUnreadSubscriptions] Successfully marked conversation ${conversationId} as read in DB`);
                })
                .then(null, (error) => {
                  console.error('[useUnreadSubscriptions] Error marking conversation as read:', error);
                });
            }
          } else {
            console.log(`[useUnreadSubscriptions] Marking conversation as unread: ${conversationId}`);
            handlersRef.current.markConversationAsUnread(conversationId);
          }
        });
        pendingUpdates.clear();
      }
      
      if (pendingClubUpdates.size > 0) {
        pendingClubUpdates.forEach(clubId => {
          // Check if this is the active club
          if (
            activeConversationRef.current.type === 'club' && 
            activeConversationRef.current.id === clubId
          ) {
            console.log(`[useUnreadSubscriptions] Skipping unread update for active club: ${clubId}`);
            
            // Mark as read optimistically in database
            if (currentUserId) {
              // Fix: Use .then().then(null, error) pattern instead of .catch()
              supabase.from('club_messages_read')
                .upsert({
                  club_id: clubId,
                  user_id: currentUserId,
                  last_read_timestamp: new Date().toISOString()
                })
                .then(() => {
                  console.log(`[useUnreadSubscriptions] Successfully marked club ${clubId} messages as read in DB`);
                })
                .then(null, (error) => {
                  console.error('[useUnreadSubscriptions] Error marking club messages as read:', error);
                });
            }
          } else {
            console.log(`[useUnreadSubscriptions] Marking club as unread: ${clubId}`);
            handlersRef.current.markClubAsUnread(clubId);
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
            if (payload.new.receiver_id === currentUserId) {
              // Queue the update instead of processing immediately
              pendingUpdates.add(payload.new.conversation_id);
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
              // Queue the update instead of processing immediately
              pendingClubUpdates.add(payload.new.club_id);
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
