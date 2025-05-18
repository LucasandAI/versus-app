
import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface UseUnreadSubscriptionsProps {
  currentUserId: string | undefined;
  isSessionReady: boolean;
  markConversationAsUnread: (conversationId: string) => void;
  markClubAsUnread: (clubId: string) => void;
  fetchUnreadCounts: () => Promise<void>;
}

// Track active state globally to ensure consistency
const activeConversations = new Set<string>();
const activeClubs = new Set<string>();

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
  
  // Listen for received messages to update unread status
  useEffect(() => {
    const handleDMReceived = (e: CustomEvent) => {
      const { conversationId, shouldMarkUnread } = e.detail;
      
      // Check both the flag and our active conversation set
      const isConversationActive = !shouldMarkUnread || activeConversations.has(conversationId);
      
      if (!isConversationActive) {
        console.log(`[useUnreadSubscriptions] Marking conversation ${conversationId} as unread from message event`);
        handlersRef.current.markConversationAsUnread(conversationId);
      } else {
        console.log(`[useUnreadSubscriptions] Conversation ${conversationId} is active, not marking as unread`);
      }
    };
    
    const handleClubMessageReceived = (e: CustomEvent) => {
      const { clubId, shouldMarkUnread } = e.detail;
      
      // Check both the flag and our active club set
      const isClubActive = !shouldMarkUnread || activeClubs.has(clubId);
      
      if (!isClubActive) {
        console.log(`[useUnreadSubscriptions] Marking club ${clubId} as unread from message event`);
        handlersRef.current.markClubAsUnread(clubId);
      } else {
        console.log(`[useUnreadSubscriptions] Club ${clubId} is active, not marking as unread`);
      }
    };
    
    const handleMessagesMarkedAsRead = (e: CustomEvent) => {
      // This is just for logging/debugging purposes
      if (e.detail.type === 'dm') {
        console.log(`[useUnreadSubscriptions] DM conversation ${e.detail.conversationId} messages marked as read`);
      } else if (e.detail.type === 'club') {
        console.log(`[useUnreadSubscriptions] Club ${e.detail.clubId} messages marked as read`);
      }
      
      // If this was an optimistic update, we can refresh the counts immediately
      if (e.detail.optimistic) {
        console.log('[useUnreadSubscriptions] Optimistic read update, refreshing counts immediately');
        window.dispatchEvent(new CustomEvent('unreadMessagesUpdated', {
          detail: { timestamp: Date.now() }
        }));
      }
    };
    
    window.addEventListener('dmMessageReceived', handleDMReceived as EventListener);
    window.addEventListener('clubMessageReceived', handleClubMessageReceived as EventListener);
    window.addEventListener('messagesMarkedAsRead', handleMessagesMarkedAsRead as EventListener);
    
    return () => {
      window.removeEventListener('dmMessageReceived', handleDMReceived as EventListener);
      window.removeEventListener('clubMessageReceived', handleClubMessageReceived as EventListener);
      window.removeEventListener('messagesMarkedAsRead', handleMessagesMarkedAsRead as EventListener);
    };
  }, []);
  
  // Setup event listeners for active conversation tracking
  useEffect(() => {
    const handleConversationActive = (e: CustomEvent) => {
      if (e.detail?.conversationId) {
        console.log('[useUnreadSubscriptions] Conversation active:', e.detail.conversationId, 
          'source:', e.detail.source || 'unknown');
        activeConversations.add(e.detail.conversationId);
      }
    };
    
    const handleClubActive = (e: CustomEvent) => {
      if (e.detail?.clubId) {
        console.log('[useUnreadSubscriptions] Club active:', e.detail.clubId, 
          'source:', e.detail.source || 'unknown');
        activeClubs.add(e.detail.clubId);
      }
    };
    
    const handleConversationInactive = (e: CustomEvent) => {
      if (e.detail?.conversationId && activeConversations.has(e.detail.conversationId)) {
        console.log('[useUnreadSubscriptions] Conversation inactive:', e.detail.conversationId, 
          'source:', e.detail.source || 'unknown');
        activeConversations.delete(e.detail.conversationId);
      }
    };
    
    const handleClubInactive = (e: CustomEvent) => {
      if (e.detail?.clubId && activeClubs.has(e.detail.clubId)) {
        console.log('[useUnreadSubscriptions] Club inactive:', e.detail.clubId, 
          'source:', e.detail.source || 'unknown');
        activeClubs.delete(e.detail.clubId);
      }
    };
    
    window.addEventListener('conversationActive', handleConversationActive as EventListener);
    window.addEventListener('clubActive', handleClubActive as EventListener);
    window.addEventListener('conversationInactive', handleConversationInactive as EventListener);
    window.addEventListener('clubInactive', handleClubInactive as EventListener);
    
    return () => {
      window.removeEventListener('conversationActive', handleConversationActive as EventListener);
      window.removeEventListener('clubActive', handleClubActive as EventListener);
      window.removeEventListener('conversationInactive', handleConversationInactive as EventListener);
      window.removeEventListener('clubInactive', handleClubInactive as EventListener);
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
      // Process direct message updates
      if (pendingUpdates.size > 0) {
        console.log('[useUnreadSubscriptions] Processing DM updates:', Array.from(pendingUpdates));
        
        pendingUpdates.forEach(conversationId => {
          // Skip if conversation is currently active/open
          if (activeConversations.has(conversationId)) {
            console.log('[useUnreadSubscriptions] Skipping active conversation:', conversationId);
            return;
          }
          handlersRef.current.markConversationAsUnread(conversationId);
        });
        pendingUpdates.clear();
      }
      
      // Process club updates
      if (pendingClubUpdates.size > 0) {
        console.log('[useUnreadSubscriptions] Processing club updates:', Array.from(pendingClubUpdates));
        
        pendingClubUpdates.forEach(clubId => {
          // Skip if club is currently active/open
          if (activeClubs.has(clubId)) {
            console.log('[useUnreadSubscriptions] Skipping active club:', clubId);
            return;
          }
          handlersRef.current.markClubAsUnread(clubId);
        });
        pendingClubUpdates.clear();
      }
      
      // Dispatch unread messages updated event
      // This needs to happen even if we filtered out all updates due to active conversations
      // So that other components know to check their unread counts
      window.dispatchEvent(new CustomEvent('unreadMessagesUpdated', {
        detail: { timestamp: Date.now() }
      }));
      
      updateTimeout = null;
    };
    
    // Queue an update with reduced debouncing
    const queueUpdate = () => {
      if (updateTimeout) return;
      updateTimeout = setTimeout(() => {
        requestAnimationFrame(processUpdates);
      }, 10); // Reduced from 50ms to 10ms for near-immediate response
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
              console.log('[useUnreadSubscriptions] New DM detected:', payload.new.conversation_id);
              
              // Skip if conversation is currently active/open
              if (activeConversations.has(payload.new.conversation_id)) {
                console.log('[useUnreadSubscriptions] Optimistically marking as read - conversation is active:', payload.new.conversation_id);
                
                // Optimistically mark as read and update UI immediately
                window.dispatchEvent(new CustomEvent('messagesMarkedAsRead', { 
                  detail: { 
                    conversationId: payload.new.conversation_id, 
                    type: 'dm',
                    optimistic: true
                  } 
                }));
                
                return;
              }
              
              // Queue the update
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
              console.log('[useUnreadSubscriptions] New club message detected:', payload.new.club_id);
              
              // Skip if club is currently active/open
              if (activeClubs.has(payload.new.club_id)) {
                console.log('[useUnreadSubscriptions] Optimistically marking as read - club is active:', payload.new.club_id);
                
                // Optimistically mark as read and update UI immediately
                window.dispatchEvent(new CustomEvent('messagesMarkedAsRead', { 
                  detail: { 
                    clubId: payload.new.club_id, 
                    type: 'club',
                    optimistic: true
                  } 
                }));
                
                return;
              }
              
              // Queue the update
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
